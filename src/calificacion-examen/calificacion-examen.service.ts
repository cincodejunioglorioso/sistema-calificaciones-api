import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCalificacionExamenDto } from './dto/create-calificacion-examen.dto';
import { UpdateCalificacionExamenDto } from './dto/update-calificacion-examen.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CalificacionExamen } from './entities/calificacion-examen.entity';
import { In, Repository } from 'typeorm';
import { Trimestre, TrimestreEstado } from '../trimestres/entities/trimestre.entity';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';
import { EstadoMatricula, Matricula } from '../matriculas/entities/matricula.entity';

@Injectable()
export class CalificacionExamenService {
  constructor(
    @InjectRepository(CalificacionExamen)
    private readonly calificacionExamenRepository: Repository<CalificacionExamen>,
    @InjectRepository(Trimestre)
    private readonly trimestreRepository: Repository<Trimestre>,
    @InjectRepository(MateriaCurso)
    private readonly materiaCursoRepository: Repository<MateriaCurso>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) {}

  //🎓 DOCENTE: Crear calificación de examen (individual o por lote)
  async create(createCalificacionExamenDto: CreateCalificacionExamenDto, docente_id: string) {
    // Validar materia-curso y permisos
    const materiaCurso = await this.materiaCursoRepository.findOne({
      where: { id: createCalificacionExamenDto.materia_curso_id },
      relations: ['curso', 'curso.periodo_lectivo'],
    });

    if (!materiaCurso) {
      throw new NotFoundException('Materia-Curso no encontrada');
    }

    if (materiaCurso.docente_id !== docente_id) {
      throw new ForbiddenException('No estás autorizado para calificar exámenes en esta materia-curso');
    }

    // Validar trimestre
    const trimestre = await this.trimestreRepository.findOne({
      where: { id: createCalificacionExamenDto.trimestre_id },
    });

    if (!trimestre) {
      throw new NotFoundException('Trimestre no encontrado');
    }

    if (trimestre.estado !== TrimestreEstado.ACTIVO) {
      throw new ForbiddenException('No se permite el ingreso de calificaciones de examen en un trimestre finalizado o inactivo');
    }

    if (trimestre.periodo_lectivo_id !== materiaCurso.curso.periodo_lectivo_id) {
      throw new ForbiddenException('El trimestre no pertenece al periodo lectivo del curso');
    }

    // Decidir entre creación individual o por lote
    if (createCalificacionExamenDto.calificaciones && createCalificacionExamenDto.calificaciones.length > 0) {
      return await this.createBatch(createCalificacionExamenDto, docente_id, materiaCurso);
    } else if (createCalificacionExamenDto.estudiante_id && createCalificacionExamenDto.calificacion_examen !== undefined) {
      return await this.createSingle(createCalificacionExamenDto, docente_id, materiaCurso);
    } else {
      throw new BadRequestException(
        'Debes enviar "estudiante_id + calificacion_examen" para calificación individual, ' +
        'o "calificaciones[]" para calificación por lote.'
      );
    }
  }

  // Crear calificación individual
  private async createSingle(
    createCalificacionExamenDto: CreateCalificacionExamenDto,
    docente_id: string,
    materiaCurso: MateriaCurso
  ) {
    // Verificar matricula
    const matricula = await this.matriculaRepository.findOne({
      where: {
        estudiante_id: createCalificacionExamenDto.estudiante_id,
        curso_id: materiaCurso.curso_id,
        estado: EstadoMatricula.ACTIVO,
      },
    });

    if (!matricula) {
      throw new BadRequestException('El estudiante no está matriculado en el curso de esta materia');
    }

    // Verificar si ya existe calificación
    const existente = await this.calificacionExamenRepository.findOne({
      where: {
        estudiante_id: createCalificacionExamenDto.estudiante_id,
        materia_curso_id: createCalificacionExamenDto.materia_curso_id,
        trimestre_id: createCalificacionExamenDto.trimestre_id,
      },
    });

    if (existente) {
      throw new ConflictException('El estudiante ya tiene calificación de examen en este trimestre. Actualiza la calificación existente.');
    }

    const calificacionExamen = this.calificacionExamenRepository.create({
      estudiante_id: createCalificacionExamenDto.estudiante_id,
      materia_curso_id: createCalificacionExamenDto.materia_curso_id,
      trimestre_id: createCalificacionExamenDto.trimestre_id,
      docente_id,
      calificacion_examen: createCalificacionExamenDto.calificacion_examen,
      observaciones: createCalificacionExamenDto.observaciones,
    });

    const saved = await this.calificacionExamenRepository.save(calificacionExamen);

    return await this.calificacionExamenRepository.findOne({
      where: { id: saved.id },
    });
  }

  // Crear calificaciones por lote
  private async createBatch(
    createCalificacionExamenDto: CreateCalificacionExamenDto,
    docente_id: string,
    materiaCurso: MateriaCurso
  ) {
    if (!createCalificacionExamenDto.calificaciones || createCalificacionExamenDto.calificaciones.length === 0) {
      throw new BadRequestException('La lista de calificaciones no puede estar vacía para calificación por lote.');
    }

    const estudiantes_ids = createCalificacionExamenDto.calificaciones.map(c => c.estudiante_id);

    // Verificar que todos estén matriculados
    const matriculas = await this.matriculaRepository.find({
      where: {
        estudiante_id: In(estudiantes_ids),
        curso_id: materiaCurso.curso_id,
        estado: EstadoMatricula.ACTIVO,
      },
    });

    if (matriculas.length !== estudiantes_ids.length) {
      const matriculadosIds = matriculas.map(m => m.estudiante_id);
      const noMatriculados = estudiantes_ids.filter(id => !matriculadosIds.includes(id));
      throw new BadRequestException(
        `Los siguientes estudiantes no están matriculados en el curso: ${noMatriculados.join(', ')}`
      );
    }

    // Verificar duplicados
    const existentesConCalificacion = await this.calificacionExamenRepository.find({
      where: {
        materia_curso_id: createCalificacionExamenDto.materia_curso_id,
        trimestre_id: createCalificacionExamenDto.trimestre_id,
        estudiante_id: In(estudiantes_ids),
      },
    });

    if (existentesConCalificacion.length > 0) {
      const duplicados = existentesConCalificacion.map(c => c.estudiante.nombres_completos).join(', ');
      throw new ConflictException(
        `Los siguientes estudiantes ya tienen calificación de examen en este trimestre: ${duplicados}. ` +
        `Actualiza las calificaciones existentes en lugar de crear nuevas.`
      );
    }

    // Crear calificaciones en lote
    const calificaciones = createCalificacionExamenDto.calificaciones.map(cal => 
      this.calificacionExamenRepository.create({
        estudiante_id: cal.estudiante_id,
        materia_curso_id: createCalificacionExamenDto.materia_curso_id,
        trimestre_id: createCalificacionExamenDto.trimestre_id,
        docente_id,
        calificacion_examen: cal.calificacion_examen,
        observaciones: cal.observaciones,
      })
    );

    const saved = await this.calificacionExamenRepository.save(calificaciones);

    return { calificaciones: saved };
  }

  //👑 ADMIN: Listar todas las calificaciones de examen
  async findAll() {
    const calificaciones = await this.calificacionExamenRepository.find({
      order: { createdAt: 'ASC' }
    });

    if (!calificaciones || calificaciones.length === 0) {
      throw new NotFoundException('No hay calificaciones de examen registradas');
    }

    return calificaciones;
  }

  //🎓 DOCENTE + 👑 ADMIN: Obtener calificación específica
  async findOne(id: string, docente_id?: string) {
    const calificacion = await this.calificacionExamenRepository.findOne({
      where: { id }
    });

    if (!calificacion) {
      throw new NotFoundException('Calificación de examen no encontrada');
    }

    if (docente_id && calificacion.docente_id !== docente_id) {
      throw new ForbiddenException('No tienes permiso para ver esta calificación');
    }

    return calificacion;
  }

  //🎓 DOCENTE + 👑 ADMIN: Listar calificaciones por materia-curso y trimestre
  async findByMateriaCursoYTrimestre(materia_curso_id: string, trimestre_id: string, docente_id?: string) {
    if (docente_id) {
      const materiaCurso = await this.materiaCursoRepository.findOne({
        where: { id: materia_curso_id }
      });

      if (!materiaCurso) {
        throw new NotFoundException('Materia-Curso no encontrada');
      }

      if (materiaCurso.docente_id !== docente_id) {
        throw new ForbiddenException('No tienes permiso para ver estas calificaciones');
      }
    }

    const calificaciones = await this.calificacionExamenRepository.find({
      where: { materia_curso_id, trimestre_id },
      order: {
        estudiante: { nombres_completos: 'DESC' }
      }
    });

    return calificaciones;
  }

  //🎓 DOCENTE + 👑 ADMIN: Listar calificaciones de un estudiante
  async findByEstudiante(estudiante_id: string) {
    const calificaciones = await this.calificacionExamenRepository.find({
      where: { estudiante_id },
      order: { createdAt: 'DESC' }
    });

    return calificaciones;
  }  


  //🎓 DOCENTE + 👑 ADMIN: Estudiantes sin calificar en materia-curso/trimestre
  async estudiantesSinCalificar(materia_curso_id: string, trimestre_id: string, docente_id?: string) {
    const materiaCurso = await this.materiaCursoRepository.findOne({
      where: { id: materia_curso_id },
      relations: ['curso'],
    });

    if (!materiaCurso) {
      throw new NotFoundException('Materia-Curso no encontrada');
    }

    if (docente_id && materiaCurso.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el docente de la materia puede ver esta información');
    }

    const estudiantesMatriculados = await this.matriculaRepository
      .createQueryBuilder('mat')
      .innerJoinAndSelect('mat.estudiante', 'est')
      .where('mat.curso_id = :curso_id', { curso_id: materiaCurso.curso_id })
      .andWhere('mat.estado = :estado', { estado: EstadoMatricula.ACTIVO })
      .andWhere(`est.id NOT IN (
        SELECT estudiante_id 
        FROM calificacion_examen 
        WHERE materia_curso_id = :materia_curso_id 
        AND trimestre_id = :trimestre_id
      )`, { materia_curso_id, trimestre_id })
      .orderBy('est.nombres_completos', 'DESC')
      .getMany();

    // Contar totales
    const totalMatriculados = await this.matriculaRepository.count({
      where: { curso_id: materiaCurso.curso_id, estado: EstadoMatricula.ACTIVO }
    });

    const totalCalificados = await this.calificacionExamenRepository.count({
      where: { materia_curso_id, trimestre_id }
    });

    return {
      materia_curso: {
        id: materiaCurso.id,
        materia_nombre: materiaCurso.materia.nombre,
        curso_nivel: materiaCurso.curso.nivel,
        curso_paralelo: materiaCurso.curso.paralelo,
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

  //🎓 DOCENTE: Actualizar calificación de examen
  async update(id: string, updateCalificacionExamenDto: UpdateCalificacionExamenDto, docente_id: string) {
    const calificacion = await this.findOne(id, docente_id);

    // Validar que el trimestre esté activo
    if (calificacion.trimestre.estado !== TrimestreEstado.ACTIVO) {
      throw new ForbiddenException(
        'No se pueden modificar calificaciones de examen en trimestres finalizados. ' +
        'Contacta al administrador si necesitas hacer correcciones.'
      );
    }

    // Validar que el docente es el asignado
    if (calificacion.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el docente asignado puede actualizar esta calificación');
    }

    // Actualizar campos
    if (updateCalificacionExamenDto.calificacion_examen !== undefined) {
      calificacion.calificacion_examen = updateCalificacionExamenDto.calificacion_examen;
    }

    if (updateCalificacionExamenDto.observaciones !== undefined) {
      calificacion.observaciones = updateCalificacionExamenDto.observaciones;
    }

    return await this.calificacionExamenRepository.save(calificacion);
  }

  //🎓 DOCENTE + 👑 ADMIN: Eliminar calificación de examen
  async remove(id: string, docente_id?: string) {
    const calificacion = await this.findOne(id, docente_id);

    if (docente_id) {
      // Validar trimestre activo
      if (calificacion.trimestre.estado !== TrimestreEstado.ACTIVO) {
        throw new ForbiddenException('No se pueden eliminar calificaciones de trimestres finalizados');
      }

      // Validar que es el docente asignado
      if (calificacion.docente_id !== docente_id) {
        throw new ForbiddenException('Solo el docente asignado puede eliminar esta calificación');
      }
    }

    await this.calificacionExamenRepository.remove(calificacion);

    return { message: 'Calificación de examen eliminada exitosamente' };
  }
}
