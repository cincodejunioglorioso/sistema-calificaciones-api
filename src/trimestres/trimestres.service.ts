import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrimestreDto } from './dto/create-trimestre.dto';
import { UpdateTrimestreDto } from './dto/update-trimestre.dto';
import { NombreTrimestre, Trimestre, TrimestreEstado } from './entities/trimestre.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PeriodosLectivosService } from '../periodos-lectivos/periodos-lectivos.service';
import { EstadoPeriodo } from '../periodos-lectivos/entities/periodos-lectivo.entity';

@Injectable()
export class TrimestresService {
  constructor(
    @InjectRepository(Trimestre)
    private readonly trimestreRepository: Repository<Trimestre>,
    @Inject(forwardRef( () => PeriodosLectivosService))
    private readonly periodosLectivosService: PeriodosLectivosService,
  ) { }

  // 👑 ADMIN: Crear trimestres
  async createTrimestres(periodoLectivoId: string) {
    // Validar que el período lectivo existe
    const periodo = await this.periodosLectivosService.findOne(periodoLectivoId);

    const trimestresExistentes = await this.trimestreRepository.count({
      where: { periodo_lectivo_id: periodoLectivoId }
    });

    if (trimestresExistentes > 0) {
      throw new ConflictException('Ya existen trimestres para este período lectivo');
    }

    const fechaInicio = new Date(periodo.fechaInicio);
    const fechaFin = new Date(periodo.fechaFin);
    const duracionTotal = fechaFin.getTime() - fechaInicio.getTime();
    const duracionTrimestre = duracionTotal / 3;

    const trimestres = [
      {
        nombre: NombreTrimestre.PRIMER_TRIMESTRE,
        fechaInicio: fechaInicio,
        fechaFin: new Date(fechaInicio.getTime() + duracionTrimestre),
        estado: TrimestreEstado.ACTIVO,
        periodo_lectivo_id: periodoLectivoId
      },
      {
        nombre: NombreTrimestre.SEGUNDO_TRIMESTRE,
        fechaInicio: new Date(fechaInicio.getTime() + duracionTrimestre),
        fechaFin: new Date(fechaInicio.getTime() + (duracionTrimestre * 2)),
        estado: TrimestreEstado.PENDIENTE,
        periodo_lectivo_id: periodoLectivoId
      },
      {
        nombre: NombreTrimestre.TERCER_TRIMESTRE,
        fechaInicio: new Date(fechaInicio.getTime() + (duracionTrimestre * 2)),
        fechaFin: fechaFin,
        estado: TrimestreEstado.PENDIENTE,
        periodo_lectivo_id: periodoLectivoId
      }
    ];

    const trimestresCreados = await this.trimestreRepository.save(
      trimestres.map(data => this.trimestreRepository.create(data))
    );

    return {
      message: 'Trimestres creados exitosamente',
      trimestre: trimestresCreados
    };
  }

  // 🌍 TODOS: Trimestres del período actual
  async findTrimestresPeriodoActual() {
    const periodoActivo = await this.periodosLectivosService.findActivo();

    return await this.trimestreRepository.find({
      where: { periodo_lectivo_id: periodoActivo.id },
      order: { createdAt: 'ASC' }
    });
  }

  // 👑 ADMIN: Ver trimestres de un período específico
  async findTrimestresByPeriodo(periodoId: string) {
    return await this.trimestreRepository.find({
      where: { periodo_lectivo_id: periodoId },
      order: { createdAt: 'ASC' }
    });
  }

  // 🌍 TODOS: Trimestre activo actual
  async findTrimestreActivo() {
    const trimestre = await this.trimestreRepository.findOne({
      where: { estado: TrimestreEstado.ACTIVO }
    });

    if (!trimestre) {
      throw new NotFoundException('No hay trimestre activo');
    }

    return trimestre;
  }

  // 👑 ADMIN: Obtener trimestre específico
  async findOne(id: string) {
    const trimestre = await this.trimestreRepository.findOne({
      where: { id }
    });

    if (!trimestre) {
      throw new NotFoundException('Trimestre no encontrado');
    }

    return trimestre;
  }

  // 👑 ADMIN: Actualizar trimestre (cambiar fechas)
  async update(id: string, updateTrimestreDto: UpdateTrimestreDto) {
    const trimestre = await this.findOne(id);
    const periodo = await this.periodosLectivosService.findOne(trimestre.periodo_lectivo_id);

    // ✅ VALIDACIÓN 1: Si se está cambiando el estado desde FINALIZADO
    if (trimestre.estado === TrimestreEstado.FINALIZADO && 
        updateTrimestreDto.estado && 
        updateTrimestreDto.estado !== TrimestreEstado.FINALIZADO) {
      
      // Validar que el período esté activo para reactivar
      if (periodo.estado !== EstadoPeriodo.ACTIVO) {
        throw new BadRequestException(
          `No se puede cambiar el estado de un trimestre cuando el período lectivo está ${periodo.estado.toLowerCase()}. ` +
          `Solo se pueden modificar trimestres del período lectivo activo.`
        );
      }
    }

    // ✅ VALIDACIÓN 2: Si se está activando un trimestre, validar que el período esté activo
    if (updateTrimestreDto.estado === TrimestreEstado.ACTIVO && 
        trimestre.estado !== TrimestreEstado.ACTIVO) {
      
      if (periodo.estado !== EstadoPeriodo.ACTIVO) {
        throw new BadRequestException(
          'No se puede activar un trimestre cuando el período lectivo no está activo'
        );
      }

      // Desactivar otros trimestres activos del mismo período
      await this.trimestreRepository.update(
        { 
          estado: TrimestreEstado.ACTIVO,
          periodo_lectivo_id: trimestre.periodo_lectivo_id
        },
        { estado: TrimestreEstado.FINALIZADO }
      );
    }

    // ✅ VALIDACIÓN 3: Validar fechas si se están actualizando
    if (updateTrimestreDto.fechaInicio || updateTrimestreDto.fechaFin) {
      const fechaInicio = new Date(updateTrimestreDto.fechaInicio || trimestre.fechaInicio);
      const fechaFin = new Date(updateTrimestreDto.fechaFin || trimestre.fechaFin);

      // Validación básica: fecha fin > fecha inicio
      if (fechaFin <= fechaInicio) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // ✅ VALIDACIÓN 4: Las fechas del trimestre deben estar dentro del período lectivo
      const periodoInicio = new Date(periodo.fechaInicio);
      const periodoFin = new Date(periodo.fechaFin);

      if (fechaInicio < periodoInicio) {
        throw new BadRequestException(
          `La fecha de inicio del trimestre (${fechaInicio.toLocaleDateString('es-ES')}) ` +
          `no puede ser anterior al inicio del período lectivo (${periodoInicio.toLocaleDateString('es-ES')})`
        );
      }

      if (fechaFin > periodoFin) {
        throw new BadRequestException(
          `La fecha de fin del trimestre (${fechaFin.toLocaleDateString('es-ES')}) ` +
          `no puede ser posterior al fin del período lectivo (${periodoFin.toLocaleDateString('es-ES')})`
        );
      }

      // ✅ VALIDACIÓN 5: No debe solaparse con otros trimestres del mismo período
      await this.validarSolapamientoFechas(id, trimestre.periodo_lectivo_id, fechaInicio, fechaFin);
    }

    // ✅ Realizar la actualización
    await this.trimestreRepository.update(id, updateTrimestreDto);

    const trimestreActualizado = await this.findOne(id);

    return {
      message: 'Trimestre actualizado exitosamente',
      trimestre: trimestreActualizado,
      cambios: {
        fechas_actualizadas: !!(updateTrimestreDto.fechaInicio || updateTrimestreDto.fechaFin),
        estado_actualizado: !!updateTrimestreDto.estado,
        estado_anterior: trimestre.estado,
        estado_nuevo: trimestreActualizado.estado
      }
    };
  }

  // ✅ NUEVO MÉTODO: Validar solapamiento de fechas
  private async validarSolapamientoFechas(trimestreId: string, periodoId: string, fechaInicio: Date, fechaFin: Date) {
    const otrosTrimestres = await this.trimestreRepository
      .createQueryBuilder('trimestre')
      .where('trimestre.periodo_lectivo_id = :periodoId', { periodoId })
      .andWhere('trimestre.id != :trimestreId', { trimestreId })
      .andWhere(
        '(trimestre.fechaInicio < :fechaFin AND trimestre.fechaFin > :fechaInicio)',
        {
          fechaInicio: fechaInicio.toISOString().split('T')[0],
          fechaFin: fechaFin.toISOString().split('T')[0]
        }
      )
      .getMany();

    if (otrosTrimestres.length > 0) {
      const trimestresConflicto = otrosTrimestres.map(t => t.nombre).join(', ');
      throw new BadRequestException(
        `Las fechas del trimestre se solapan con: ${trimestresConflicto}. ` +
        `Los trimestres no pueden tener fechas superpuestas.`
      );
    }
  }

  // 🔒 Validar si se puede reactivar un trimestre finalizado
  private async validarReactivacion(trimestre: Trimestre) {
    // 1️⃣ Verificar que el período lectivo esté ACTIVO
    const periodo = await this.periodosLectivosService.findOne(trimestre.periodo_lectivo_id);

    if (periodo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException(
        `No se puede reactivar un trimestre de un período lectivo ${periodo.estado.toLowerCase()}. ` +
        `Solo se pueden reactivar trimestres del período lectivo actual.`
      );
    }
  }

  private getEstadoMensaje(estado: TrimestreEstado): string {
    switch (estado) {
      case TrimestreEstado.ACTIVO:
        return 'reactivado';
      case TrimestreEstado.FINALIZADO:
        return 'finalizado';
      case TrimestreEstado.PENDIENTE:
        return 'marcado como pendiente';
      default:
        return 'actualizado';
    }
  }

}
