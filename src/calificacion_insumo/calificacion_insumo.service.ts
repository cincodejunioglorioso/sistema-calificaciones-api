import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCalificacionInsumoDto } from './dto/create-calificacion_insumo.dto';
import { UpdateCalificacionInsumoDto } from './dto/update-calificacion_insumo.dto';
import { In, Not, Repository } from 'typeorm';
import { CalificacionInsumo } from './entities/calificacion_insumo.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InsumosService } from '../insumos/insumos.service';
import { EstadoInsumo, Insumo } from '../insumos/entities/insumo.entity';
import { EstadoMatricula, Matricula } from '../matriculas/entities/matricula.entity';
import { RecuperacionInsumo } from '../recuperacion_insumo/entities/recuperacion_insumo.entity';

@Injectable()
export class CalificacionInsumoService {
  constructor(
    @InjectRepository(CalificacionInsumo)
    private readonly calificacionInsumoRepository: Repository<CalificacionInsumo>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    @InjectRepository(RecuperacionInsumo)
    private readonly recuperacionInsumoRepository: Repository<RecuperacionInsumo>,
    private readonly insumoService: InsumosService,
  ) { }

  //🎓 DOCENTE: Calificar Insumo
  async create(createCalificacionInsumoDto: CreateCalificacionInsumoDto, docente_id: string) {
    const insumo = await this.insumoService.findOne(createCalificacionInsumoDto.insumo_id);

    if (insumo.materia_curso.docente_id !== docente_id) {
      throw new ForbiddenException('No tienes permiso para calificar este insumo.');
    }

    if ([EstadoInsumo.PUBLICADO, EstadoInsumo.CERRADO].includes(insumo.estado)) {
      throw new ForbiddenException('No se pueden calificar insumos publicados o cerrados.');
    }

    if (createCalificacionInsumoDto.calificaciones && createCalificacionInsumoDto.calificaciones.length > 0) {
      return await this.createBatch(createCalificacionInsumoDto, docente_id, insumo);
    } else if (createCalificacionInsumoDto.estudiante_id && createCalificacionInsumoDto.nota !== undefined) {
      return await this.createSingle(createCalificacionInsumoDto, docente_id, insumo);
    } else {
      throw new BadRequestException(
        'Debes enviar "estudiante_id + nota" para calificación individual, ' +
        'o "calificaciones[]" para calificación múltiple.'
      );
    }
  }

  private async createSingle(
    createCalificacionInsumoDto: CreateCalificacionInsumoDto,
    docente_id: string,
    insumo: Insumo
  ) {

    const calificacionExistente = await this.calificacionInsumoRepository.findOne({
      where: {
        insumo_id: createCalificacionInsumoDto.insumo_id,
        estudiante_id: createCalificacionInsumoDto.estudiante_id,
      },
    });

    if (calificacionExistente) {
      throw new ConflictException('El estudiante ya tiene calificacion en este insumo, actualiza la calificacion existente.');
    }

    const calificacion = this.calificacionInsumoRepository.create({
      insumo_id: createCalificacionInsumoDto.insumo_id,
      estudiante_id: createCalificacionInsumoDto.estudiante_id,
      nota_original: createCalificacionInsumoDto.nota,
      nota_final: createCalificacionInsumoDto.nota,
      observaciones: createCalificacionInsumoDto.observaciones,
      docente_id
    });

    const savedCalificacion = await this.calificacionInsumoRepository.save(calificacion);

    if (insumo.estado === EstadoInsumo.BORRADOR) {
      await this.insumoService.cambiarEstadoAActivo(insumo.id);
    }

    return await this.findOne(savedCalificacion.id);
  }

  private async createBatch(
    createCalificacionInsumoDto: CreateCalificacionInsumoDto,
    docente_id: string,
    insumo: Insumo
  ) {

    if (!createCalificacionInsumoDto.calificaciones || createCalificacionInsumoDto.calificaciones.length === 0) {
      throw new BadRequestException('La lista de calificaciones no puede estar vacía para calificación múltiple.');
    }

    const estudiantes_ids = createCalificacionInsumoDto.calificaciones.map(c => c.estudiante_id);

    const existentesConCalificacion = await this.calificacionInsumoRepository.find({
      where: {
        insumo_id: createCalificacionInsumoDto.insumo_id,
        estudiante_id: In(estudiantes_ids),
      },
    });

    if (existentesConCalificacion.length > 0) {
      const duplicados = existentesConCalificacion.map(c => c.estudiante.nombres_completos).join(', ');
      throw new ConflictException(
        `Los siguientes estudiantes ya tienen calificación en este insumo: ${duplicados}`);
    }

    const calificaciones = createCalificacionInsumoDto.calificaciones.map(c =>
      this.calificacionInsumoRepository.create({
        insumo_id: createCalificacionInsumoDto.insumo_id,
        estudiante_id: c.estudiante_id,
        nota_original: c.nota,
        nota_final: c.nota,
        observaciones: c.observaciones,
        docente_id
      })
    );

    const savedCalificaciones = await this.calificacionInsumoRepository.save(calificaciones);

    if (insumo.estado === EstadoInsumo.BORRADOR) {
      await this.insumoService.cambiarEstadoAActivo(insumo.id);
    }

    return { calificaciones: savedCalificaciones }
  }

  // 👑 ADMIN: Listar todas las calificaciones (Debugging)
  async findAll() {
    const calificaciones = await this.calificacionInsumoRepository.find({
      order: { createdAt: 'DESC' }
    });

    if (!calificaciones || calificaciones.length === 0) {
      throw new NotFoundException('No hay calificaciones de insumos registradas.');
    }

    return calificaciones;
  }

  // 🎓 DOCENTE + 👑 ADMIN: Obtener calificación específica
  async findOne(id: string, docente_id?: string) {
    const calificacion = await this.calificacionInsumoRepository.findOne({
      where: { id }
    });

    if (!calificacion) {
      throw new NotFoundException('Calificación no encontrada');
    }

    if (docente_id && calificacion.insumo.materia_curso.docente_id !== docente_id) {
      throw new ForbiddenException('No tienes permiso para ver esta calificación.');
    }

    return calificacion;
  }

  // 👑 ADMIN + 🎓 DOCENTE: Listar calificaciones de un insumo
  async findByInsumo(insumo_id: string, docente_id?: string) {

    if (docente_id) {
      const insumo = await this.insumoService.findOne(insumo_id);
      if (insumo.materia_curso.docente_id !== docente_id) {
        throw new ForbiddenException('No tienes permiso para ver las calificaciones de este insumo.');
      }
    }

    const calificaciones = await this.calificacionInsumoRepository.find({
      where: { insumo_id },
      order: {
        estudiante: { nombres_completos: 'ASC' }
      }
    });

    return calificaciones;
  }

  // 👑 ADMIN + 🎓 DOCENTE: Listar calificaciones de un estudiante en todos los insumos
  async findByEstudiante(estudiante_id: string) {
    const calificaciones = await this.calificacionInsumoRepository.find({
      where: { estudiante_id },
      order: { createdAt: 'DESC' }
    });

    return calificaciones;
  }

  // 🎓 DOCENTE: Actualizar calificación
  async update(id: string, updateCalificacionInsumoDto: UpdateCalificacionInsumoDto, docente_id: string) {
    const calificacion = await this.findOne(id, docente_id);

    // Validar que el insumo NO esté PUBLICADO
    if (calificacion.insumo.estado !== EstadoInsumo.ACTIVO) {
      throw new ForbiddenException(
        `No puedes editar calificaciones de insumos en estado ${calificacion.insumo.estado}. ` +
        `Solo se permiten actualizaciones en estado ACTIVO. ` +
        `Si el insumo está PUBLICADO y fue un error, solicita al administrador que lo reactive. ` +
        `Si el estudiante necesita mejorar su nota, usa el sistema de RECUPERACIONES.`
      );
    }

    // Validar que el docente es el asignado
    if (calificacion.insumo.materia_curso.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el docente asignado puede editar esta calificación');
    }

    if (updateCalificacionInsumoDto.nota !== undefined) {
      calificacion.nota_original = updateCalificacionInsumoDto.nota;
      calificacion.nota_final = updateCalificacionInsumoDto.nota;
    }

    if (updateCalificacionInsumoDto.observaciones !== undefined) {
      calificacion.observaciones = updateCalificacionInsumoDto.observaciones;
    }

    return await this.calificacionInsumoRepository.save(calificacion);
  }

  // 🎓 DOCENTE + 👑 ADMIN: Calcular promedio de un insumo
  async calcularPromedioInsumo(insumo_id: string): Promise<number> {
    const resultado = await this.calificacionInsumoRepository
      .createQueryBuilder('cal')
      .select('AVG(cal.nota_final)', 'promedio')
      .where('cal.insumo_id = :insumo_id', { insumo_id })
      .getRawOne();

    return resultado?.promedio ? parseFloat(Number(resultado.promedio).toFixed(2)) : 0;
  }

  // 🎓 DOCENTE + 👑 ADMIN: Listar estudiantes sin calificar en un insumo
  async estudiantesSinCalificar(insumo_id: string, docente_id?: string) {
    const insumo = await this.insumoService.findOne(insumo_id);

    // Si es docente, validar permisos
    if (docente_id && insumo.materia_curso.docente_id !== docente_id) {
      throw new ForbiddenException('No tienes permiso para ver este insumo');
    }

    // Obtener estudiantes matriculados en el curso de esta materia
    const estudiantesMatriculados = await this.matriculaRepository
      .createQueryBuilder('mat')
      .innerJoinAndSelect('mat.estudiante', 'est')
      .innerJoin('mat.curso', 'cur')
      .innerJoin('materias_curso', 'mc', 'mc.curso_id = cur.id AND mc.id = :materia_curso_id', {
        materia_curso_id: insumo.materia_curso_id
      })
      .where('mat.estado = :estado', { estado: EstadoMatricula.ACTIVO })
      .andWhere(`est.id NOT IN (
        SELECT estudiante_id 
        FROM calificacion_insumo 
        WHERE insumo_id = :insumo_id
      )`, { insumo_id })
      .orderBy('est.nombres_completos', 'ASC')
      .getMany();

    // Contar totales
    const totalMatriculados = await this.matriculaRepository
      .createQueryBuilder('mat')
      .innerJoin('mat.curso', 'cur')
      .innerJoin('materias_curso', 'mc', 'mc.curso_id = cur.id AND mc.id = :materia_curso_id', {
        materia_curso_id: insumo.materia_curso_id
      })
      .where('mat.estado = :estado', { estado: EstadoMatricula.ACTIVO })
      .getCount();

    const totalCalificados = await this.calificacionInsumoRepository.count({
      where: { insumo_id }
    });

    return {
      insumo: {
        id: insumo.id,
        nombre: insumo.nombre,
        estado: insumo.estado,
        materia: insumo.materia_curso.materia.nombre,
        curso: insumo.materia_curso.curso.nivel + ' ' + insumo.materia_curso.curso.paralelo
      },
      estadisticas: {
        total_matriculados: totalMatriculados,
        total_calificados: totalCalificados,
        total_sin_calificar: estudiantesMatriculados.length,
        porcentaje_completado: totalMatriculados > 0
          ? ((totalCalificados / totalMatriculados) * 100).toFixed(2)
          : 0
      },
      estudiantes_sin_calificar: estudiantesMatriculados.map(mat => ({
        id: mat.estudiante.id,
        cedula: mat.estudiante.estudiante_cedula,
        nombres_completos: mat.estudiante.nombres_completos,
      }))
    };
  }

  // 🎓 DOCENTE + 👑 ADMIN: Eliminar calificación (solo en estado ACTIVO)
  async remove(id: string, docente_id?: string) {
    const calificacion = await this.findOne(id, docente_id);

    // Si es docente, validar que el insumo esté ACTIVO
    if (docente_id) {
      if (calificacion.insumo.estado !== EstadoInsumo.ACTIVO) {
        throw new ForbiddenException(
          'Solo puedes eliminar calificaciones de insumos en estado ACTIVO'
        );
      }

      if (calificacion.insumo.materia_curso.docente_id !== docente_id) {
        throw new ForbiddenException('Solo el docente asignado puede eliminar esta calificación');
      }
    }

    // ✅ NUEVO: Eliminar recuperaciones asociadas primero
    const recuperaciones = await this.recuperacionInsumoRepository.find({
      where: { calificacion_insumo_id: id }
    });

    if (recuperaciones.length > 0) {
      await this.recuperacionInsumoRepository.remove(recuperaciones);
    }

    await this.calificacionInsumoRepository.remove(calificacion);

    return { message: 'Calificación eliminada exitosamente' };
  }
}
