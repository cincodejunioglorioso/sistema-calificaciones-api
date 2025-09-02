import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrimestreDto } from './dto/create-trimestre.dto';
import { UpdateTrimestreDto } from './dto/update-trimestre.dto';
import { NombreTrimestre, Trimestre, TrimestreEstado } from './entities/trimestre.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PeriodosLectivosService } from 'src/periodos-lectivos/periodos-lectivos.service';
import { EstadoPeriodo } from 'src/periodos-lectivos/entities/periodos-lectivo.entity';

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

    // Validar que el trimestre no esté finalizado (FINALIZADO)
    if (trimestre.estado === TrimestreEstado.FINALIZADO) {
      throw new BadRequestException('No se puede modificar un trimestre finalizado');
    }

    // Validar fechas si se están actualizando
    if (updateTrimestreDto.fechaInicio || updateTrimestreDto.fechaFin) {
      const fechaInicio = new Date(updateTrimestreDto.fechaInicio || trimestre.fechaInicio);
      const fechaFin = new Date(updateTrimestreDto.fechaFin || trimestre.fechaFin);

      if (fechaFin <= fechaInicio) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }

    await this.trimestreRepository.update(id, updateTrimestreDto);

    return {
      message: 'Trimestre actualizado exitosamente',
      trimestre: await this.findOne(id)
    };
  }

  // 👑 ADMIN: Cambiar estado del trimestre
  async cambiarEstado(id: string) {
    const trimestre = await this.findOne(id);

    let nuevoEstado: TrimestreEstado;

    switch (trimestre.estado) {
      case TrimestreEstado.PENDIENTE:
        nuevoEstado = TrimestreEstado.ACTIVO;
        // Desactivar otros trimestres activos
        await this.trimestreRepository.update(
          { estado: TrimestreEstado.ACTIVO },
          { estado: TrimestreEstado.FINALIZADO }
        );
        break;

      case TrimestreEstado.ACTIVO:
        nuevoEstado = TrimestreEstado.FINALIZADO;
        break;

      case TrimestreEstado.FINALIZADO:
        // 🆕 VALIDACIÓN INTELIGENTE: ¿Se puede reactivar?
        await this.validarReactivacion(trimestre);
        nuevoEstado = TrimestreEstado.ACTIVO;

        // Desactivar otros trimestres activos antes de reactivar
        await this.trimestreRepository.update(
          { estado: TrimestreEstado.ACTIVO },
          { estado: TrimestreEstado.FINALIZADO }
        );
        break;

      default:
        nuevoEstado = TrimestreEstado.PENDIENTE;
    }

    await this.trimestreRepository.update(id, { estado: nuevoEstado });

    return {
      message: `Trimestre ${this.getEstadoMensaje(nuevoEstado)} exitosamente`,
      trimestre: {
        id: trimestre.id,
        nombre: trimestre.nombre
      },
      estado_anterior: trimestre.estado,
      estado_nuevo: nuevoEstado
    };
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
