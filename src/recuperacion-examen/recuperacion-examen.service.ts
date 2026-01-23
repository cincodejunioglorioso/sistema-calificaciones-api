import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRecuperacionExamenDto } from './dto/create-recuperacion-examen.dto';
import { UpdateRecuperacionExamenDto } from './dto/update-recuperacion-examen.dto';
import { Repository } from 'typeorm';
import { RecuperacionExamen } from './entities/recuperacion-examen.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CalificacionExamen } from '../calificacion-examen/entities/calificacion-examen.entity';
import { TrimestreEstado } from '../trimestres/entities/trimestre.entity';

@Injectable()
export class RecuperacionExamenService {

  constructor(
    @InjectRepository(RecuperacionExamen)
    private readonly recuperacionExamenRepository: Repository<RecuperacionExamen>,
    @InjectRepository(CalificacionExamen)
    private readonly calificacionExamenRepository: Repository<CalificacionExamen>,
  ) { }

  // 🎓 DOCENTE: Crear/Actualizar recuperación de examen
  async create(createDto: CreateRecuperacionExamenDto, docente_id: string) {
    // Obtener calificación original
    const calificacion = await this.calificacionExamenRepository.findOne({
      where: { id: createDto.calificacion_examen_id }
    });

    if (!calificacion) {
      throw new NotFoundException('Calificación de examen no encontrada');
    }

    // Validar que el docente sea el asignado
    if (calificacion.docente_id !== docente_id) {
      throw new BadRequestException('Solo el docente asignado puede registrar recuperaciones');
    }

    // Validar que el trimestre esté activo
    if (calificacion.trimestre.estado !== TrimestreEstado.ACTIVO) {
      throw new BadRequestException('No se pueden registrar recuperaciones en trimestres finalizados');
    }

    // Validar que la nota original sea menor a 7 si se requiere trabajo de refuerzo
    const notaOriginal = calificacion.calificacion_original ?? calificacion.calificacion_examen;

    if (notaOriginal >= 7.0) {
      // Solo necesita segundo examen
      if (createDto.trabajo_refuerzo !== undefined && createDto.trabajo_refuerzo !== null) {
        throw new BadRequestException(
          'Calificaciones >= 7.0 solo necesitan segundo examen, no trabajo de refuerzo'
        );
      }
      if (!createDto.segundo_examen) {
        throw new BadRequestException('Debes ingresar la calificación del segundo examen');
      }
    } else {
      // Necesita segundo examen Y trabajo de refuerzo
      if (!createDto.segundo_examen || !createDto.trabajo_refuerzo) {
        throw new BadRequestException(
          'Calificaciones < 7.0 necesitan segundo examen Y trabajo de refuerzo'
        );
      }
    }

    // Verificar si ya existe recuperación
    let recuperacion = await this.recuperacionExamenRepository.findOne({
      where: { calificacion_examen_id: createDto.calificacion_examen_id }
    });

    if (recuperacion) {
      // Actualizar existente
      recuperacion.segundo_examen = createDto.segundo_examen ?? recuperacion.segundo_examen;
      recuperacion.trabajo_refuerzo = createDto.trabajo_refuerzo ?? recuperacion.trabajo_refuerzo;
      recuperacion.observaciones = createDto.observaciones ?? recuperacion.observaciones;
    } else {
      // Crear nueva
      recuperacion = this.recuperacionExamenRepository.create({
        calificacion_examen_id: createDto.calificacion_examen_id,
        segundo_examen: createDto.segundo_examen,
        trabajo_refuerzo: createDto.trabajo_refuerzo,
        observaciones: createDto.observaciones,
      });
    }

    await this.recuperacionExamenRepository.save(recuperacion);

    // Recalcular nota final
    await this.recalcularNotaFinal(createDto.calificacion_examen_id);

    return await this.recuperacionExamenRepository.findOne({
      where: { id: recuperacion.id }
    });
  }

  findAll() {
    return `This action returns all recuperacionExamen`;
  }

  findOne(id: number) {
    return `This action returns a #${id} recuperacionExamen`;
  }

  // 🎓 DOCENTE + 👑 ADMIN: Obtener recuperación por calificación
  async findByCalificacion(calificacion_examen_id: string, docente_id?: string) {
    const calificacion = await this.calificacionExamenRepository.findOne({
      where: { id: calificacion_examen_id }
    });

    if (!calificacion) {
      throw new NotFoundException('Calificación no encontrada');
    }

    // Validar permisos si es docente
    if (docente_id && calificacion.docente_id !== docente_id) {
      throw new BadRequestException('No tienes permiso para ver esta recuperación');
    }

    const recuperacion = await this.recuperacionExamenRepository.findOne({
      where: { calificacion_examen_id }
    });

    const notaOriginal = calificacion.calificacion_original ?? calificacion.calificacion_examen;
    const necesitaRefuerzo = notaOriginal < 7.0;

    return {
      calificacion: {
        id: calificacion.id,
        estudiante: calificacion.estudiante.nombres_completos,
        materia: calificacion.materia_curso.materia.nombre,
        trimestre: calificacion.trimestre.nombre,
        calificacion_original: notaOriginal,
        calificacion_actual: calificacion.calificacion_examen,
      },
      necesita_trabajo_refuerzo: necesitaRefuerzo,
      recuperacion: recuperacion || null,
    };
  }

  // 🎓 DOCENTE: Actualizar recuperación
  async update(id: string, updateDto: UpdateRecuperacionExamenDto, docente_id: string) {
    const recuperacion = await this.recuperacionExamenRepository.findOne({
      where: { id }
    });

    if (!recuperacion) {
      throw new NotFoundException('Recuperación no encontrada');
    }

    // Validar permisos
    if (recuperacion.calificacion_examen.docente_id !== docente_id) {
      throw new BadRequestException('Solo el docente asignado puede actualizar esta recuperación');
    }

    // Validar que el trimestre esté activo
    if (recuperacion.calificacion_examen.trimestre.estado !== TrimestreEstado.ACTIVO) {
      throw new BadRequestException('No se pueden actualizar recuperaciones en trimestres finalizados');
    }

    // Actualizar campos
    if (updateDto.segundo_examen !== undefined) {
      recuperacion.segundo_examen = updateDto.segundo_examen;
    }
    if (updateDto.trabajo_refuerzo !== undefined) {
      recuperacion.trabajo_refuerzo = updateDto.trabajo_refuerzo;
    }
    if (updateDto.observaciones !== undefined) {
      recuperacion.observaciones = updateDto.observaciones;
    }

    await this.recuperacionExamenRepository.save(recuperacion);

    // Recalcular nota final
    await this.recalcularNotaFinal(recuperacion.calificacion_examen_id);

    return await this.recuperacionExamenRepository.findOne({
      where: { id }
    });
  }

  // 🎓 DOCENTE + 👑 ADMIN: Eliminar recuperación
  async remove(id: string, docente_id?: string) {
    const recuperacion = await this.recuperacionExamenRepository.findOne({
      where: { id }
    });

    if (!recuperacion) {
      throw new NotFoundException('Recuperación no encontrada');
    }

    // Validar permisos
    if (docente_id && recuperacion.calificacion_examen.docente_id !== docente_id) {
      throw new BadRequestException('Solo el docente asignado puede eliminar esta recuperación');
    }

    const calificacion_examen_id = recuperacion.calificacion_examen_id;

    // Eliminar recuperación
    await this.recuperacionExamenRepository.remove(recuperacion);

    // Restaurar calificación original
    await this.restaurarCalificacionOriginal(calificacion_examen_id);

    return { message: 'Recuperación eliminada exitosamente' };
  }

  // 🔧 PRIVADO: Recalcular nota final después de recuperación
  private async recalcularNotaFinal(calificacion_examen_id: string): Promise<void> {
    const calificacion = await this.calificacionExamenRepository.findOne({
      where: { id: calificacion_examen_id }
    });

    if (!calificacion) {
      throw new NotFoundException('Calificación no encontrada');
    }

    const recuperacion = await this.recuperacionExamenRepository.findOne({
      where: { calificacion_examen_id }
    });

    if (!recuperacion) {
      return; // No hay recuperación, mantener nota original
    }

    // ✅ CONVERTIR A NÚMERO - Guardar nota original si no existe
    if (calificacion.calificacion_original === null) {
      calificacion.calificacion_original = Number(calificacion.calificacion_examen);
    }

    // ✅ CONVERTIR TODO A NÚMERO
    const notaOriginal = Number(calificacion.calificacion_original);
    const segundoExamen = Number(recuperacion.segundo_examen);
    const trabajoRefuerzo = recuperacion.trabajo_refuerzo ? Number(recuperacion.trabajo_refuerzo) : null;

    let notaFinal: number;

    if (notaOriginal >= 7.0) {
      // Solo promedia: examen original + segundo examen
      if (!segundoExamen) {
        return; // No calcular si falta dato
      }
      notaFinal = Number(
        ((notaOriginal + segundoExamen) / 2).toFixed(2)
      );
    } else {
      // Promedia: examen original + segundo examen + trabajo refuerzo
      if (!segundoExamen || trabajoRefuerzo === null) {
        return; // No calcular si faltan datos
      }
      notaFinal = Number(
        ((notaOriginal + segundoExamen + trabajoRefuerzo) / 3).toFixed(2)
      );
    }

    // Actualizar calificación_examen con la nota final
    calificacion.calificacion_examen = notaFinal;
    await this.calificacionExamenRepository.save(calificacion);
  }

  // 🔧 PRIVADO: Restaurar calificación original cuando se elimina recuperación
  private async restaurarCalificacionOriginal(calificacion_examen_id: string): Promise<void> {
    const calificacion = await this.calificacionExamenRepository.findOne({
      where: { id: calificacion_examen_id }
    });

    if (!calificacion) {
      return;
    }

    // ✅ CONVERTIR A NÚMERO - Restaurar nota original si existe
    if (calificacion.calificacion_original !== null) {
      calificacion.calificacion_examen = Number(calificacion.calificacion_original);
      calificacion.calificacion_original = null;
      await this.calificacionExamenRepository.save(calificacion);
    }
  }
}
