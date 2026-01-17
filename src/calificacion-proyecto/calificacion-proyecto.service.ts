import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCalificacionProyectoDto } from './dto/create-calificacion-proyecto.dto';
import { UpdateCalificacionProyectoDto } from './dto/update-calificacion-proyecto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CalificacionProyecto } from './entities/calificacion-proyecto.entity';
import { In, Repository } from 'typeorm';
import { Curso } from '../cursos/entities/curso.entity';
import { Trimestre, TrimestreEstado } from '../trimestres/entities/trimestre.entity';
import { EstadoMatricula, Matricula } from '../matriculas/entities/matricula.entity';

@Injectable()
export class CalificacionProyectoService {

  constructor(
    @InjectRepository(CalificacionProyecto)
    private readonly calificacionProyectoRepository: Repository<CalificacionProyecto>,
    @InjectRepository(Curso)
    private readonly cursoRepository: Repository<Curso>,
    @InjectRepository(Trimestre)
    private readonly trimestreRepository: Repository<Trimestre>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) { }


  //🎓 TUTOR: Crear calificación de proyecto integrador (individual o batch)
  async create(createCalificacionProyectoDto: CreateCalificacionProyectoDto, docente_id: string) {
    // Validar curso y permisos
    const curso = await this.cursoRepository.findOne({
      where: { id: createCalificacionProyectoDto.curso_id },
      relations: ['periodo_lectivo'],
    });

    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }

    if (curso.docente_id !== docente_id) {
      throw new ForbiddenException('No autorizado para calificar en este curso');
    }

    // Validar trimestre
    const trimestre = await this.trimestreRepository.findOne({
      where: { id: createCalificacionProyectoDto.trimestre_id },
    });

    if (!trimestre) {
      throw new NotFoundException('Trimestre no encontrado');
    }

    if (trimestre.estado !== TrimestreEstado.ACTIVO) {
      throw new ForbiddenException('No se permite el ingreso de calificacion de proyecto en un trimestre finalizado o inactivo');
    }

    if (trimestre.periodo_lectivo_id !== curso.periodo_lectivo_id) {
      throw new ForbiddenException('El trimestre no pertenece al periodo lectivo del curso');
    }

    // Decidir entre creación individual o por lote
    if (createCalificacionProyectoDto.calificaciones && createCalificacionProyectoDto.calificaciones.length > 0) {
      return await this.createBatch(createCalificacionProyectoDto, docente_id, curso);
    } else if (createCalificacionProyectoDto.estudiante_id && createCalificacionProyectoDto.calificacion_proyecto !== undefined) {
      return await this.createSingle(createCalificacionProyectoDto, docente_id, curso);
    } else {
      throw new BadRequestException(
        'Debe proporcionar estudiante_id y calificacion_proyecto para creación individual, o calificaciones para creación por lote'
      );
    }
  }

  // Crear calificación individual
  private async createSingle(
    createCalificacionProyectoDto: CreateCalificacionProyectoDto,
    docente_id: string,
    curso: Curso
  ) {
    const matricula = await this.matriculaRepository.findOne({
      where: {
        estudiante_id: createCalificacionProyectoDto.estudiante_id,
        curso_id: createCalificacionProyectoDto.curso_id,
        estado: EstadoMatricula.ACTIVO,
      },
    });

    if (!matricula) {
      throw new BadRequestException('El estudiante no está matriculado en el curso');
    }

    const existente = await this.calificacionProyectoRepository.findOne({
      where: {
        estudiante_id: createCalificacionProyectoDto.estudiante_id,
        curso_id: createCalificacionProyectoDto.curso_id,
        trimestre_id: createCalificacionProyectoDto.trimestre_id,
      },
    });

    if (existente) {
      throw new ConflictException('El estudiante ya ha sido calificado, actualice la calificación si desea modificarla');
    }

    const calificacionProyecto = this.calificacionProyectoRepository.create({
      estudiante_id: createCalificacionProyectoDto.estudiante_id,
      curso_id: createCalificacionProyectoDto.curso_id,
      trimestre_id: createCalificacionProyectoDto.trimestre_id,
      docente_id,
      calificacion_proyecto: createCalificacionProyectoDto.calificacion_proyecto,
      observaciones: createCalificacionProyectoDto.observaciones,
    });

    const saved = await this.calificacionProyectoRepository.save(calificacionProyecto);

    return await this.calificacionProyectoRepository.findOne({
      where: { id: saved.id },
    });
  }

  // 🎓 TUTOR: Crear calificaciones por lote
  private async createBatch(
    createCalificacionProyectoDto: CreateCalificacionProyectoDto,
    docente_id: string,
    curso: Curso
  ) {
    if (!createCalificacionProyectoDto.calificaciones || createCalificacionProyectoDto.calificaciones.length === 0) {
      throw new BadRequestException('No se proporcionaron calificaciones');
    }

    const estudiantes_ids = createCalificacionProyectoDto.calificaciones.map(c => c.estudiante_id);

    // Verificar que todos estén matriculados
    const matriculas = await this.matriculaRepository.find({
      where: {
        estudiante_id: In(estudiantes_ids),
        curso_id: createCalificacionProyectoDto.curso_id,
        estado: EstadoMatricula.ACTIVO,
      },
    });

    if (matriculas.length !== estudiantes_ids.length) {
      const matriculadosIds = matriculas.map(m => m.estudiante_id);
      const noMatriculados = estudiantes_ids.filter(id => !matriculadosIds.includes(id));
      throw new BadRequestException(`Los siguientes estudiantes no están matriculados: ${noMatriculados.join(', ')}`);
    }

    // Verificar duplicados
    const existentes = await this.calificacionProyectoRepository.find({
      where: {
        estudiante_id: In(estudiantes_ids),
        curso_id: createCalificacionProyectoDto.curso_id,
        trimestre_id: createCalificacionProyectoDto.trimestre_id,
      },
    });

    if (existentes.length > 0) {
      const yaCalificados = existentes.map(e => e.estudiante_id);
      throw new ConflictException(`Estudiantes ya calificados: ${yaCalificados.join(', ')}`);
    }

    // Crear calificaciones
    const calificaciones = createCalificacionProyectoDto.calificaciones.map(c =>
      this.calificacionProyectoRepository.create({
        estudiante_id: c.estudiante_id,
        curso_id: createCalificacionProyectoDto.curso_id,
        trimestre_id: createCalificacionProyectoDto.trimestre_id,
        docente_id,
        calificacion_proyecto: c.calificacion_proyecto,
        observaciones: c.observaciones,
      })
    );

    const savedCalificaciones = await this.calificacionProyectoRepository.save(calificaciones);

    return { calificaciones: savedCalificaciones };
  }

  //👑 ADMIN: Listar todas las calificaciones de proyecto
  async findAll() {
    const calificaciones = await this.calificacionProyectoRepository.find({
      order: { createdAt: 'DESC' }
    });

    if (!calificaciones || calificaciones.length === 0) {
      throw new NotFoundException('No hay calificaciones de proyecto registradas');
    }

    return calificaciones;
  }

  //🎓 TUTOR + 👑 ADMIN: Obtener calificación específica
  async findOne(id: string, docente_id?: string) {
    const calificacion = await this.calificacionProyectoRepository.findOne({
      where: { id }
    });

    if (!calificacion) {
      throw new NotFoundException('Calificación de proyecto no encontrada');
    }

    return calificacion;
  }

  //🎓 TUTOR + 👑 ADMIN: Listar calificaciones por curso y trimestre
  async findByCursoYTrimestre(curso_id: string, trimestre_id: string, docente_id?: string) {

    if (docente_id) {
      const curso = await this.cursoRepository.findOne({
        where: { id: curso_id },
        relations: ['docente']
      });

      if (!curso) {
        throw new NotFoundException('Curso no encontrado');
      }

    }

    const calificaciones = await this.calificacionProyectoRepository.find({
      where: { curso_id, trimestre_id },
      order: {
        estudiante: { nombres_completos: 'ASC' }
      }
    });

    return calificaciones;
  }

  //🎓 TUTOR + 👑 ADMIN: Listar calificaciones de un estudiante
  async findByEstudiante(estudiante_id: string) {
    const calificaciones = await this.calificacionProyectoRepository.find({
      where: { estudiante_id },
      order: { createdAt: 'DESC' }
    });

    return calificaciones;
  }

  //🎓 TUTOR + 👑 ADMIN: Estudiantes sin calificar en un curso/trimestre
  async estudiantesSinCalificar(curso_id: string, trimestre_id: string, docente_id?: string) {
    const curso = await this.cursoRepository.findOne({
      where: { id: curso_id }
    });

    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }

    if (docente_id && curso.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el docente del curso puede ver esta información');
    }

    const estudiantesMatriculados = await this.matriculaRepository
      .createQueryBuilder('mat')
      .innerJoinAndSelect('mat.estudiante', 'est')
      .where('mat.curso_id = :curso_id', { curso_id })
      .andWhere('mat.estado = :estado', { estado: EstadoMatricula.ACTIVO })
      .andWhere(`est.id NOT IN (
        SELECT estudiante_id 
        FROM calificacion_proyecto 
        WHERE curso_id = :curso_id 
        AND trimestre_id = :trimestre_id
      )`, { curso_id, trimestre_id })
      .orderBy('est.nombres_completos', 'ASC')
      .getMany();

    // Contar totales
    const totalMatriculados = await this.matriculaRepository.count({
      where: { curso_id, estado: EstadoMatricula.ACTIVO }
    });

    const totalCalificados = await this.calificacionProyectoRepository.count({
      where: { curso_id, trimestre_id }
    });

    return {
      curso: {
        id: curso.id,
        nivel: curso.nivel,
        paralelo: curso.paralelo
      },
      trimestre_id,
      estadisticas: {
        total_matriculados: totalMatriculados,
        total_calificados: totalCalificados,
        total_sin_calificar: estudiantesMatriculados.length,
        porcentaje_completado: totalMatriculados > 0
          ? ((totalCalificados / totalMatriculados) * 100).toFixed(2)
          : '0.00'
      },
      estudiantes_sin_calificar: estudiantesMatriculados.map(mat => ({
        id: mat.estudiante.id,
        cedula: mat.estudiante.estudiante_cedula,
        nombres_completos: mat.estudiante.nombres_completos,
      }))
    };
  }

  //🎓 TUTOR: Actualizar calificación de proyecto
  async update(id: string, updateCalificacionProyectoDto: UpdateCalificacionProyectoDto, docente_id: string) {
    const calificacion = await this.findOne(id, docente_id);

    // Validar que el trimestre esté activo
    if (calificacion.trimestre.estado !== TrimestreEstado.ACTIVO) {
      throw new ForbiddenException(
        'No puedes editar calificaciones de trimestres inactivos. ' +
        'Si necesitas corregir un error, solicita al administrador que reactive el trimestre.'
      );
    }

    // Validar que el tutor es el asignado
    if (calificacion.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el tutor asignado puede editar esta calificación');
    }

    // Actualizar campos
    if (updateCalificacionProyectoDto.calificacion_proyecto !== undefined) {
      calificacion.calificacion_proyecto = updateCalificacionProyectoDto.calificacion_proyecto;
    }

    if (updateCalificacionProyectoDto.observaciones !== undefined) {
      calificacion.observaciones = updateCalificacionProyectoDto.observaciones;
    }

    return await this.calificacionProyectoRepository.save(calificacion);
  }

  //🎓 TUTOR + 👑 ADMIN: Eliminar calificación de proyecto
  async remove(id: string, docente_id?: string) {
    const calificacion = await this.findOne(id, docente_id);

    if (docente_id) {
      if (calificacion.trimestre.estado !== TrimestreEstado.ACTIVO) {
        throw new ForbiddenException(
          'No puedes eliminar calificaciones de trimestres inactivos'
        );
      }

      if (calificacion.docente_id !== docente_id) {
        throw new ForbiddenException('Solo el tutor asignado puede eliminar esta calificación');
      }
    }

    await this.calificacionProyectoRepository.remove(calificacion);

    return { message: 'Calificación de proyecto eliminada exitosamente' };
  }

}
