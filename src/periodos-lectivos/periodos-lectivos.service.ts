import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePeriodoLectivoDto } from './dto/create-periodos-lectivo.dto';
import { UpdatePeriodoLectivoDto } from './dto/update-periodos-lectivo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoPeriodo, PeriodoLectivo } from './entities/periodos-lectivo.entity';
import { Not, Repository } from 'typeorm';
import { TrimestresService } from 'src/trimestres/trimestres.service';

@Injectable()
export class PeriodosLectivosService {

  constructor(
    @InjectRepository(PeriodoLectivo)
    private readonly periodoLectivoRepository: Repository<PeriodoLectivo>,
    @Inject(forwardRef(() => TrimestresService))
    private readonly trimestresService: TrimestresService
  ) { }

  // 👑 ADMIN: Crear período lectivo
  async create(createPeriodoLectivoDto: CreatePeriodoLectivoDto) {

    const periodoActivo = await this.periodoLectivoRepository.findOne({
      where: { estado: EstadoPeriodo.ACTIVO }
    });

    if (periodoActivo) {
      throw new ConflictException(
        `No se puede crear un nuevo período lectivo mientras el período "${periodoActivo.nombre}" esté activo. ` +
        `Primero debe finalizar el período actual.`
      );
    }

    const fechaInicio = new Date(createPeriodoLectivoDto.fechaInicio);
    const fechaFin = new Date(createPeriodoLectivoDto.fechaFin);

    if (fechaFin <= fechaInicio) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }


    // Verificar solapamiento con otros períodos
    const periodosExistentes = await this.periodoLectivoRepository
      .createQueryBuilder('periodo')
      .where(
        '(periodo.fechaInicio <= :fechaFin AND periodo.fechaFin >= :fechaInicio)',
        {
          fechaInicio: createPeriodoLectivoDto.fechaInicio,
          fechaFin: createPeriodoLectivoDto.fechaFin
        }
      )
      .getMany();

    if (periodosExistentes.length > 0) {
      throw new ConflictException('Las fechas se solapan con otro período lectivo existente');
    }

    const periodoLectivo = this.periodoLectivoRepository.create(createPeriodoLectivoDto);
    const nuevoPeriodo = await this.periodoLectivoRepository.save(periodoLectivo);

    const trimestres = await this.trimestresService.createTrimestres(nuevoPeriodo.id);

    return {
      message: 'Período lectivo creado exitosamente',
      periodo: nuevoPeriodo,
      trimestres: trimestres.trimestre
    };
  }

  // 👑 ADMIN: Listar períodos
  async findAll() {
    const periodos = await this.periodoLectivoRepository.find({
      order: { fechaInicio: 'DESC' }
    });

    if (!periodos) {
      throw new NotFoundException('No hay periodos lectivos registrados, crea uno nuevo');
    }

    return periodos;
  }

  // 👑 ADMIN + 🎓 DOCENTE: Obtener período activo
  async findActivo() {
    const periodoActivo = await this.periodoLectivoRepository.findOne({
      where: { estado: EstadoPeriodo.ACTIVO }
    });

    if (!periodoActivo) {
      throw new NotFoundException('No hay período lectivo activo');
    }

    return periodoActivo;
  }

  // 👑 ADMIN: Obtener período específico
  async findOne(id: string) {
    const periodo = await this.periodoLectivoRepository.findOne({
      where: { id }
    });

    if (!periodo) {
      throw new NotFoundException('Período lectivo no encontrado');
    }

    return periodo;
  }

  // 👑 ADMIN: Actualizar período
  async update(id: string, updatePeriodoDto: UpdatePeriodoLectivoDto) {
    const periodo = await this.findOne(id);

    // Validar fechas si se están actualizando
    if (updatePeriodoDto.fechaInicio || updatePeriodoDto.fechaFin) {
      const fechaInicio = new Date(updatePeriodoDto.fechaInicio || periodo.fechaInicio);
      const fechaFin = new Date(updatePeriodoDto.fechaFin || periodo.fechaFin);

      if (fechaFin <= fechaInicio) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Verificar solapamiento excluyendo el período actual
      const periodosExistentes = await this.periodoLectivoRepository
        .createQueryBuilder('periodo')
        .where('periodo.id != :id', { id })
        .andWhere(
          '(periodo.fechaInicio <= :fechaFin AND periodo.fechaFin >= :fechaInicio)',
          {
            fechaInicio: fechaInicio.toISOString().split('T')[0],
            fechaFin: fechaFin.toISOString().split('T')[0]
          }
        )
        .getMany();

      if (periodosExistentes.length > 0) {
        throw new ConflictException('Las fechas se solapan con otro período lectivo existente');
      }
    }

    const trimestres = await this.trimestresService.findTrimestresByPeriodo(id);
    await this.periodoLectivoRepository.update(id, updatePeriodoDto);

    return {
      message: 'Período lectivo actualizado exitosamente',
      periodo: await this.findOne(id),
      advertencia: trimestres.length > 0 ?
        'IMPORTANTE: Verifique y ajuste las fechas de los trimestres si es necesario, ya que las fechas del período lectivo han cambiado.' :
        null,
      trimestres_afectados: trimestres.length
    };
  }

  // 👑 ADMIN: Cambiar estado de cualquier período lectivo
  async cambiarEstado(id: string) {
    const periodo = await this.findOne(id);

    // Si el período está ACTIVO → se va a FINALIZAR
    if (periodo.estado === EstadoPeriodo.ACTIVO) {
      // 🆕 VALIDAR: No finalizar si hay trimestres sin finalizar
      const trimestres = await this.trimestresService.findTrimestresByPeriodo(id);
      const trimestresNoFinalizados = trimestres.filter(t => t.estado !== 'FINALIZADO');

      if (trimestresNoFinalizados.length > 0) {
        throw new BadRequestException(
          `No se puede finalizar el período lectivo porque hay ${trimestresNoFinalizados.length} trimestre(s) sin finalizar. ` +
          `Primero debe finalizar todos los trimestres del período.`
        );
      }

      await this.periodoLectivoRepository.update(id, { estado: EstadoPeriodo.FINALIZADO });

      return {
        message: `Período lectivo "${periodo.nombre}" finalizado exitosamente`,
        periodo: {
          id: periodo.id,
          nombre: periodo.nombre,
          estado_anterior: EstadoPeriodo.ACTIVO,
          estado_nuevo: EstadoPeriodo.FINALIZADO
        }
      };
    }

    // Si el período está FINALIZADO → se va a ACTIVAR (validar que no haya otro activo)
    if (periodo.estado === EstadoPeriodo.FINALIZADO) {
      const periodoActivo = await this.periodoLectivoRepository.findOne({
        where: {
          estado: EstadoPeriodo.ACTIVO,
          id: Not(id) // 🔧 EXCLUIR el período actual de la búsqueda
        }
      });

      if (periodoActivo) {
        throw new ConflictException(
          `No se puede activar el período lectivo "${periodo.nombre}" mientras el período "${periodoActivo.nombre}" esté activo. ` +
          `Primero debe finalizar el período activo actual.`
        );
      }

      await this.periodoLectivoRepository.update(id, { estado: EstadoPeriodo.ACTIVO });

      return {
        message: `Período lectivo "${periodo.nombre}" activado exitosamente`,
        periodo: {
          id: periodo.id,
          nombre: periodo.nombre,
          estado_anterior: EstadoPeriodo.FINALIZADO,
          estado_nuevo: EstadoPeriodo.ACTIVO
        }
      };
    }
  }
}
