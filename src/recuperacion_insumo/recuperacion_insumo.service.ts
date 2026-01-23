import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRecuperacionInsumoDto } from './dto/create-recuperacion_insumo.dto';
import { UpdateRecuperacionInsumoDto } from './dto/update-recuperacion_insumo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RecuperacionInsumo } from './entities/recuperacion_insumo.entity';
import { Repository } from 'typeorm';
import { CalificacionInsumo } from '../calificacion_insumo/entities/calificacion_insumo.entity';
import { CalificacionInsumoService } from '../calificacion_insumo/calificacion_insumo.service';
import { EstadoInsumo } from '../insumos/entities/insumo.entity';

@Injectable()
export class RecuperacionInsumoService {

  constructor(
    @InjectRepository(RecuperacionInsumo)
    private readonly recuperacionInsumoRepository: Repository<RecuperacionInsumo>,

    @InjectRepository(CalificacionInsumo)
    private readonly calificacionInsumoRepository: Repository<CalificacionInsumo>,

    private readonly calificacionInsumoService: CalificacionInsumoService
  ) { }

  async create(createRecuperacionInsumoDto: CreateRecuperacionInsumoDto, docente_id: string) {
    const calificacion = await this.calificacionInsumoService.findOne(
      createRecuperacionInsumoDto.calificacion_insumo_id, docente_id
    );

    if (calificacion.insumo.estado !== EstadoInsumo.ACTIVO) {
      throw new ForbiddenException('Solo puedes calificar insumos activos.');
    }

    if (calificacion.docente_id !== docente_id) {
      throw new ForbiddenException('No tienes permiso para registrar recuperacion para esta calificacion.');
    }

    if (Number(calificacion.nota_original) === 10) {
      throw new BadRequestException('Estudiantes con 10 de calificacion no requieren recuperación.');
    }

    const intentosTotales = await this.recuperacionInsumoRepository.count({
      where: { calificacion_insumo_id: createRecuperacionInsumoDto.calificacion_insumo_id }
    });

    if (intentosTotales === 2) {
      throw new BadRequestException(`Intentos de recuperacion agotados. Intentos: ${intentosTotales}`);
    }

    const recuperacion = this.recuperacionInsumoRepository.create({
      calificacion_insumo_id: createRecuperacionInsumoDto.calificacion_insumo_id,
      nota_recuperacion: createRecuperacionInsumoDto.nota_recuperacion,
      observaciones: createRecuperacionInsumoDto.observaciones,
      intento: intentosTotales + 1,
    });

    const savedRecuperacion = await this.recuperacionInsumoRepository.save(recuperacion);

    await this.recalcularNotaFinal(createRecuperacionInsumoDto.calificacion_insumo_id);

    return await this.recuperacionInsumoRepository.findOne({ where: { id: savedRecuperacion.id } });
  }

  // 👑 ADMIN: Listar todas las recuperaciones
  async findAll() {
    const recuperaciones = await this.recuperacionInsumoRepository.find({
      order: { createdAt: 'DESC' }
    });

    if (!recuperaciones || recuperaciones.length === 0) {
      throw new NotFoundException('No hay recuperaciones registradas');
    }

    return recuperaciones;
  }

  // 🎓 DOCENTE + 👑 ADMIN: Obtener recuperación específica
  async findOne(id: string, docente_id?: string) {
    const recuperacion = await this.recuperacionInsumoRepository.findOne({
      where: { id }
    });

    if (!recuperacion) {
      throw new NotFoundException('Recuperación no encontrada');
    }

    // Si es docente, validar que sea el asignado
    if (docente_id && recuperacion.calificacion_insumo.docente_id !== docente_id) {
      throw new ForbiddenException('No tienes permiso para ver esta recuperación');
    }

    return recuperacion;
  }

  // 🎓 DOCENTE + 👑 ADMIN: Historial de recuperaciones de una calificación
  async findByCalificacion(calificacion_insumo_id: string, docente_id?: string) {
    // Validar permisos
    const calificacion = await this.calificacionInsumoService.findOne(
      calificacion_insumo_id,
      docente_id
    );

    const recuperaciones = await this.recuperacionInsumoRepository.find({
      where: { calificacion_insumo_id },
      order: { intento: 'ASC' }
    });

    return {
      calificacion: {
        id: calificacion.id,
        estudiante: calificacion.estudiante.nombres_completos,
        insumo: calificacion.insumo.nombre,
        nota_original: calificacion.nota_original,
        nota_final: calificacion.nota_final
      },
      total_intentos: recuperaciones.length,
      intentos_restantes: 2 - recuperaciones.length,
      recuperaciones
    };
  }

  // 🎓 DOCENTE + 👑 ADMIN: Recuperaciones de todos los estudiantes en un insumo
  async findByInsumo(insumo_id: string, docente_id?: string) {
    // Obtener todas las calificaciones del insumo (con validación de permisos)
    const calificaciones = await this.calificacionInsumoService.findByInsumo(
      insumo_id,
      docente_id
    );

    // Obtener todas las recuperaciones de esas calificaciones
    const calificaciones_ids = calificaciones.map(c => c.id);

    const recuperaciones = await this.recuperacionInsumoRepository
      .createQueryBuilder('rec')
      .where('rec.calificacion_insumo_id IN (:...ids)', { ids: calificaciones_ids })
      .orderBy('rec.createdAt', 'DESC')
      .getMany();

    // Agrupar por estudiante
    const estudiantesConRecuperaciones = calificaciones
      .filter(cal => {
        return recuperaciones.some(rec => rec.calificacion_insumo_id === cal.id);
      })
      .map(cal => {
        const recuperacionesEstudiante = recuperaciones.filter(
          rec => rec.calificacion_insumo_id === cal.id
        );

        return {
          estudiante: cal.estudiante.nombres_completos,
          nota_original: cal.nota_original,
          nota_final: cal.nota_final,
          total_intentos: recuperacionesEstudiante.length,
          recuperaciones: recuperacionesEstudiante.map(rec => ({
            intento: rec.intento,
            nota: rec.nota_recuperacion,
            fecha: rec.createdAt,
            observaciones: rec.observaciones
          }))
        };
      });

    // Estadísticas
    const totalRecuperaciones = recuperaciones.length;
    const estudiantesConUnaRecuperacion = estudiantesConRecuperaciones.filter(
      e => e.total_intentos === 1
    ).length;
    const estudiantesConDosRecuperaciones = estudiantesConRecuperaciones.filter(
      e => e.total_intentos === 2
    ).length;

    return {
      insumo: {
        id: calificaciones[0]?.insumo.id,
        nombre: calificaciones[0]?.insumo.nombre,
        estado: calificaciones[0]?.insumo.estado
      },
      estadisticas: {
        total_recuperaciones: totalRecuperaciones,
        estudiantes_con_recuperaciones: estudiantesConRecuperaciones.length,
        con_1_intento: estudiantesConUnaRecuperacion,
        con_2_intentos: estudiantesConDosRecuperaciones
      },
      estudiantes: estudiantesConRecuperaciones
    };
  }

  // 🎓 DOCENTE: Actualizar recuperación
  async update(
    id: string,
    updateRecuperacionDto: UpdateRecuperacionInsumoDto,
    docente_id: string
  ) {
    const recuperacion = await this.findOne(id, docente_id);

    if (recuperacion.calificacion_insumo.insumo.estado !== EstadoInsumo.ACTIVO) {
      throw new ForbiddenException('Solo puedes calificar insumos activos.');
    }

    if (recuperacion.calificacion_insumo.docente_id !== docente_id) {
      throw new ForbiddenException(
        'Solo el docente asignado puede editar esta recuperación'
      );
    }

    if (updateRecuperacionDto.nota_recuperacion !== undefined) {
      recuperacion.nota_recuperacion = updateRecuperacionDto.nota_recuperacion;
    }

    if (updateRecuperacionDto.observaciones !== undefined) {
      recuperacion.observaciones = updateRecuperacionDto.observaciones;
    }

    await this.recuperacionInsumoRepository.save(recuperacion);

    await this.recalcularNotaFinal(recuperacion.calificacion_insumo_id);

    return await this.recuperacionInsumoRepository.findOne({
      where: { id }
    });
  }

  // 🎓 DOCENTE + 👑 ADMIN: Eliminar recuperación
  async remove(id: string, docente_id?: string) {
    const recuperacion = await this.findOne(id, docente_id);

    if (docente_id) {
      if (recuperacion.calificacion_insumo.insumo.estado !== EstadoInsumo.ACTIVO) {
        throw new ForbiddenException('Solo puedes eliminar recuperaciones de insumos activos.');
      }
    }

    const todasRecuperaciones = await this.recuperacionInsumoRepository.find({
      where: { calificacion_insumo_id: recuperacion.calificacion_insumo_id },
      order: { intento: 'DESC' }
    });

    if (todasRecuperaciones.length > 0) {
      const ultimoIntento = todasRecuperaciones[0];

      if (recuperacion.id !== ultimoIntento.id) {
        throw new BadRequestException(
          `Solo puedes eliminar el último intento (Intento ${ultimoIntento.intento}). ` +
          `Primero elimina el intento ${ultimoIntento.intento} antes de eliminar el intento ${recuperacion.intento}.`
        );
      }
    }

    const calificacion_insumo_id = recuperacion.calificacion_insumo_id;

    await this.recuperacionInsumoRepository.remove(recuperacion);

    await this.recalcularNotaFinal(calificacion_insumo_id);

    return { message: 'Se ha eliminado el intento de recuperacion' };
  }

  // 🔧 PRIVADO: Recalcular nota_final de una calificación
  private async recalcularNotaFinal(calificacion_insumo_id: string): Promise<number> {

    const calificacion = await this.calificacionInsumoRepository.findOne({
      where: { id: calificacion_insumo_id }
    });

    if (!calificacion) {
      throw new NotFoundException('Calificación no encontrada');
    }

    const recuperaciones = await this.recuperacionInsumoRepository.find({
      where: { calificacion_insumo_id },
      order: { intento: 'ASC' }
    });

    let nota_final: number = 0;

    if (recuperaciones.length === 0) {
      nota_final = Number(calificacion.nota_original);

    } else if (recuperaciones.length === 1) {
      const nota_original = Number(calificacion.nota_original);
      const nota_recuperacion_1 = Number(recuperaciones[0].nota_recuperacion);
      nota_final = Number(((nota_original + nota_recuperacion_1) / 2).toFixed(2));

    } else if (recuperaciones.length === 2) {
      const nota_final_actual = Number(calificacion.nota_final);
      const nota_recuperacion_2 = Number(recuperaciones[1].nota_recuperacion);

      nota_final = Number(((nota_final_actual + nota_recuperacion_2) / 2).toFixed(2));
    }

    calificacion.nota_final = nota_final;
    await this.calificacionInsumoRepository.save(calificacion);

    return nota_final;
  }
}
