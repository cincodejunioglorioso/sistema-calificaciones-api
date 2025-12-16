import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePeriodoLectivoDto } from './dto/create-periodos-lectivo.dto';
import { UpdatePeriodoLectivoDto } from './dto/update-periodos-lectivo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoPeriodo, PeriodoLectivo } from './entities/periodos-lectivo.entity';
import { Not, Repository, DataSource } from 'typeorm';
import { TrimestresService } from '../trimestres/trimestres.service';
import { EstadoMatricula, Matricula } from '../matriculas/entities/matricula.entity';
import { NivelCurso } from '../cursos/entities/curso.entity';
import { EstadoEstudiante, Estudiante } from '../estudiantes/entities/estudiante.entity';

@Injectable()
export class PeriodosLectivosService {

  constructor(
    @InjectRepository(PeriodoLectivo)
    private readonly periodoLectivoRepository: Repository<PeriodoLectivo>,
    @Inject(forwardRef(() => TrimestresService))
    private readonly trimestresService: TrimestresService,
    private readonly dataSource: DataSource,
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

    // ✅ VALIDACIÓN 1: Si se está cambiando el estado, usar lógica específica
    if (updatePeriodoDto.estado && updatePeriodoDto.estado !== periodo.estado) {
      return await this.cambiarEstado(id, updatePeriodoDto.estado);
    }

    // ✅ VALIDACIÓN 2: Validar fechas si se están actualizando
    if (updatePeriodoDto.fechaInicio || updatePeriodoDto.fechaFin) {
      const fechaInicio = new Date(updatePeriodoDto.fechaInicio || periodo.fechaInicio);
      const fechaFin = new Date(updatePeriodoDto.fechaFin || periodo.fechaFin);

      if (fechaFin <= fechaInicio) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // ✅ VALIDACIÓN 3: Verificar solapamiento excluyendo el período actual
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

      // ✅ VALIDACIÓN 4: Las fechas del período deben contener TODOS los trimestres
      const trimestres = await this.trimestresService.findTrimestresByPeriodo(id);
      
      if (trimestres.length > 0) {
        // Encontrar la fecha más temprana y más tardía de los trimestres
        const fechasInicio = trimestres.map(t => new Date(t.fechaInicio));
        const fechasFin = trimestres.map(t => new Date(t.fechaFin));
        
        const trimestreInicioMasTemprano = new Date(Math.min(...fechasInicio.map(f => f.getTime())));
        const trimestreFinMasTardio = new Date(Math.max(...fechasFin.map(f => f.getTime())));

        if (fechaInicio > trimestreInicioMasTemprano) {
          throw new BadRequestException(
            `La fecha de inicio del período (${fechaInicio.toLocaleDateString('es-ES')}) ` +
            `no puede ser posterior al inicio del trimestre más temprano (${trimestreInicioMasTemprano.toLocaleDateString('es-ES')}). ` +
            `Primero ajuste las fechas de los trimestres.`
          );
        }

        if (fechaFin < trimestreFinMasTardio) {
          throw new BadRequestException(
            `La fecha de fin del período (${fechaFin.toLocaleDateString('es-ES')}) ` +
            `no puede ser anterior al fin del trimestre más tardío (${trimestreFinMasTardio.toLocaleDateString('es-ES')}). ` +
            `Primero ajuste las fechas de los trimestres.`
          );
        }
      }
    }

    await this.periodoLectivoRepository.update(id, updatePeriodoDto);

    const trimestresCount = await this.contarTrimestres(id);

    return {
      message: 'Período lectivo actualizado exitosamente',
      periodo: await this.findOne(id),
      advertencia: trimestresCount > 0 ?
        'IMPORTANTE: Verifique que las fechas de los trimestres sigan siendo coherentes con las nuevas fechas del período.' :
        null,
      trimestres_afectados: trimestresCount
    };
  }

  // 👑 ADMIN: Cambiar estado de cualquier período lectivo (MEJORADO)
  async cambiarEstado(id: string, nuevoEstado?: EstadoPeriodo) {
    const periodo = await this.findOne(id);

    let estadoFinal: EstadoPeriodo;

    if (nuevoEstado) {
      estadoFinal = nuevoEstado;
    } else {
      estadoFinal = periodo.estado === EstadoPeriodo.ACTIVO 
        ? EstadoPeriodo.FINALIZADO 
        : EstadoPeriodo.ACTIVO;
    }

    if (estadoFinal === EstadoPeriodo.FINALIZADO && periodo.estado === EstadoPeriodo.ACTIVO) {
      // Validar que todos los trimestres estén finalizados
      const trimestres = await this.trimestresService.findTrimestresByPeriodo(id);
      const trimestresNoFinalizados = trimestres.filter(t => t.estado !== 'FINALIZADO');

      if (trimestresNoFinalizados.length > 0) {
        throw new BadRequestException(
          `No se puede finalizar el período lectivo porque hay ${trimestresNoFinalizados.length} trimestre(s) sin finalizar. ` +
          `Primero debe finalizar todos los trimestres del período.`
        );
      }
    }

    if (estadoFinal === EstadoPeriodo.ACTIVO && periodo.estado === EstadoPeriodo.FINALIZADO) {
      // Validar que no haya otro período activo
      const periodoActivo = await this.periodoLectivoRepository.findOne({
        where: {
          estado: EstadoPeriodo.ACTIVO,
          id: Not(id)
        }
      });

      if (periodoActivo) {
        throw new ConflictException(
          `No se puede activar el período lectivo "${periodo.nombre}" mientras el período "${periodoActivo.nombre}" esté activo. ` +
          `Primero debe finalizar el período activo actual.`
        );
      }
    }

    await this.periodoLectivoRepository.update(id, { estado: estadoFinal });

    return {
      message: `Período lectivo "${periodo.nombre}" ${estadoFinal === EstadoPeriodo.ACTIVO ? 'activado' : 'finalizado'} exitosamente`,
      periodo: {
        id: periodo.id,
        nombre: periodo.nombre,
        estado_anterior: periodo.estado,
        estado_nuevo: estadoFinal
      }
    };
  }

  async finalizarPeriodo(id: string) {
    const periodo = await this.findOne(id);

    if (periodo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException('El período lectivo no está activo');
    }

    await this.dataSource.transaction(async (manager) => {
      //Finalizar todas las matrículas activas en el período lectivo
      await manager.update(Matricula,
        {
          periodo_lectivo_id: id,
          estado: EstadoMatricula.ACTIVO
        },
        {
          estado: EstadoMatricula.FINALIZADO
        }
      );
      // Finalizar el período lectivo
      await manager.update(PeriodoLectivo, id, {
        estado: EstadoPeriodo.FINALIZADO,
        fechaFin: new Date()
      });

      //Procesar estudiantes segun su matricula finalizada
      const matriculasFinalizadas = await manager.find(Matricula, {
        where: {
          periodo_lectivo_id: id,
          estado: EstadoMatricula.FINALIZADO
        },
        relations: ['curso', 'estudiante']
      });

      for (const matricula of matriculasFinalizadas) {
        // graduar estudiantes de tercero de BGU
        if (matricula.curso.nivel === NivelCurso.TERCERO_BACHILLERATO) {
          await manager.update(Estudiante, matricula.estudiante.id, {
            estado: EstadoEstudiante.GRADUADO
          });
        } else if (matricula.estudiante.estado !== EstadoEstudiante.ACTIVO) {
          await manager.update(Estudiante, matricula.estudiante.id, {
            estado: EstadoEstudiante.SIN_MATRICULA
          });
        }
      }
    });

    return await this.findOne(id);
  };

  private async contarTrimestres(periodoId: string): Promise<number> {
    try {
      const trimestres = await this.trimestresService.findTrimestresByPeriodo(periodoId);
      return trimestres.length;
    } catch {
      return 0;
    }
  }
}