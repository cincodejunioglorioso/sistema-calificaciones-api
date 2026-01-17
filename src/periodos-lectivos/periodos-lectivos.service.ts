import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePeriodoLectivoDto } from './dto/create-periodos-lectivo.dto';
import { UpdatePeriodoLectivoDto } from './dto/update-periodos-lectivo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoPeriodo, PeriodoLectivo } from './entities/periodos-lectivo.entity';
import { Not, Repository, DataSource } from 'typeorm';
import { TrimestresService } from '../trimestres/trimestres.service';
import { EstadoMatricula, Matricula } from '../matriculas/entities/matricula.entity';
import { Curso, EstadoCurso, NivelCurso } from '../cursos/entities/curso.entity';
import { EstadoEstudiante, Estudiante } from '../estudiantes/entities/estudiante.entity';
import { TrimestreEstado } from '../trimestres/entities/trimestre.entity';
import { PromedioPeriodoService } from '../promedio-periodo/promedio-periodo.service';
import { EstadoMateriaCurso, MateriaCurso } from '../materia-curso/entities/materia-curso.entity';

@Injectable()
export class PeriodosLectivosService {

  constructor(
    @InjectRepository(PeriodoLectivo)
    private readonly periodoLectivoRepository: Repository<PeriodoLectivo>,
    @Inject(forwardRef(() => TrimestresService))
    private readonly trimestresService: TrimestresService,
    @Inject(forwardRef(() => PromedioPeriodoService))
    private readonly promedioPeriodoService: PromedioPeriodoService,
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

    if (periodo.estado === EstadoPeriodo.FINALIZADO) {
      throw new BadRequestException(
        'No se puede editar un período finalizado. Los datos académicos están cerrados permanentemente.'
      );
    }

    // Validar fechas si se están actualizando
    if (updatePeriodoDto.fechaInicio || updatePeriodoDto.fechaFin) {
      const fechaInicio = new Date(updatePeriodoDto.fechaInicio || periodo.fechaInicio);
      const fechaFin = new Date(updatePeriodoDto.fechaFin || periodo.fechaFin);

      if (fechaFin <= fechaInicio) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      //  Verificar solapamiento excluyendo el período actual
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

      // Las fechas del período deben contener TODOS los trimestres
      const trimestres = await this.trimestresService.findTrimestresByPeriodo(id);

      if (trimestres.length > 0) {
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

  /**
   * 👑 ADMIN: Validar si se puede cerrar/finalizar un período lectivo
   */
  async validarCierrePeriodo(id: string) {
    const periodo = await this.findOne(id);

    if (periodo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException('El período lectivo no está activo');
    }

    // Validar que los 3 trimestres estén FINALIZADOS
    const trimestres = await this.trimestresService.findTrimestresByPeriodo(id);

    if (trimestres.length !== 3) {
      throw new BadRequestException('El período debe tener exactamente 3 trimestres');
    }

    const trimestresNoFinalizados = trimestres.filter(t => t.estado !== TrimestreEstado.FINALIZADO);

    if (trimestresNoFinalizados.length > 0) {
      return {
        puede_cerrar: false,
        errores: [
          `Trimestres sin finalizar: ${trimestresNoFinalizados.map(t => t.nombre).join(', ')}`
        ]
      };
    }

    // Contar entidades que se afectarán
    const totalMatriculas = await this.dataSource.getRepository(Matricula).count({
      where: {
        periodo_lectivo_id: id,
        estado: EstadoMatricula.ACTIVO
      }
    });

    const totalCursos = await this.dataSource.getRepository(Curso).count({
      where: {
        periodo_lectivo_id: id,
        estado: EstadoCurso.ACTIVO
      }
    });

    const totalMateriasCurso = await this.dataSource.getRepository(MateriaCurso).count({
      where: {
        periodo_lectivo_id: id,
        estado: EstadoMateriaCurso.ACTIVO
      }
    });

    return {
      puede_cerrar: true,
      errores: [],
      preview: {
        total_matriculas_a_finalizar: totalMatriculas,
        total_cursos_a_inactivar: totalCursos,
        total_materias_curso_a_inactivar: totalMateriasCurso,
        advertencia: 'Esta acción es IRREVERSIBLE. Se finalizarán matrículas y se actualizarán estados de estudiantes, cursos y asignaciones.'
      }
    };
  }

  // 👑 ADMIN: Cambiar estado de período lectivo ACTIVO -> FINALIZADO
  async cambiarEstado(id: string) {
    const periodo = await this.findOne(id);

    if (periodo.estado === EstadoPeriodo.FINALIZADO) {
      throw new BadRequestException(
        'No se puede reactivar un período finalizado. Los datos académicos están cerrados permanentemente. ' +
        'Debe crear un nuevo período lectivo.'
      );
    }

    return await this.finalizarPeriodoLectivo(id);
  }

  // 👑 ADMIN: Finalizar período lectivo (IRREVERSIBLE)
  async finalizarPeriodoLectivo(id: string) {
    const validacion = await this.validarCierrePeriodo(id);

    if (!validacion.puede_cerrar) {
      throw new BadRequestException(validacion.errores.join(', '));
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // ESTUDIANTES
      // Obtener estudiantes de 3° Bachillerato con matrícula ACTIVA
      const matriculasTercero = await queryRunner.manager
        .createQueryBuilder(Matricula, 'matricula')
        .innerJoinAndSelect('matricula.curso', 'curso')
        .where('matricula.periodo_lectivo_id = :periodoId', { periodoId: id })
        .andWhere('matricula.estado = :estado', { estado: EstadoMatricula.ACTIVO })
        .andWhere('curso.nivel = :nivel', { nivel: NivelCurso.TERCERO_BACHILLERATO })
        .getMany();

      let estudiantesGraduados = 0;
      let estudiantesSinMatricula = 0;

      // Procesar estudiantes de 3° Bachillerato (graduación condicional)
      for (const matricula of matriculasTercero) {
        // Obtener promedios anuales del estudiante
        const promedios = await queryRunner.manager
          .createQueryBuilder('promedio_periodo', 'pp')
          .where('pp.estudiante_id = :estudianteId', { estudianteId: matricula.estudiante_id })
          .andWhere('pp.periodo_lectivo_id = :periodoId', { periodoId: id })
          .getMany();

        // Verificar si TODOS los promedios >= 7.0
        const todosAprobados = promedios.length > 0 &&
          promedios.every(p => Number(p.promedio_anual) >= 7.0);

        if (todosAprobados) {
          await queryRunner.manager.update(
            Estudiante,
            { id: matricula.estudiante_id },
            { estado: EstadoEstudiante.GRADUADO }
          );
          estudiantesGraduados++;
        } else {
          await queryRunner.manager.update(
            Estudiante,
            { id: matricula.estudiante_id },
            { estado: EstadoEstudiante.SIN_MATRICULA }
          );
          estudiantesSinMatricula++;
        }
      }

      // Estudiantes que no son de 3° Bachillerato pasan a estado → SIN_MATRICULA
      const otrasMatriculas = await queryRunner.manager
        .createQueryBuilder(Matricula, 'matricula')
        .innerJoin('matricula.curso', 'curso')
        .where('matricula.periodo_lectivo_id = :periodoId', { periodoId: id })
        .andWhere('matricula.estado = :estado', { estado: EstadoMatricula.ACTIVO })
        .andWhere('curso.nivel != :nivel', { nivel: NivelCurso.TERCERO_BACHILLERATO })
        .select('matricula.estudiante_id')
        .distinct(true)
        .getRawMany();

      for (const { estudiante_id } of otrasMatriculas) {
        await queryRunner.manager.update(
          Estudiante,
          { id: estudiante_id },
          { estado: EstadoEstudiante.SIN_MATRICULA }
        );
        estudiantesSinMatricula++;
      }

      // MATRÍCULAS
      const resultMatriculas = await queryRunner.manager.update(
        Matricula,
        {
          periodo_lectivo_id: id,
          estado: EstadoMatricula.ACTIVO
        },
        { estado: EstadoMatricula.FINALIZADO }
      );

      // MATERIA-CURSO = Asignaciones ACTIVAS -> INACTIVAS
      const resultMateriasCurso = await queryRunner.manager
        .createQueryBuilder()
        .update('materias_curso')
        .set({ estado: EstadoMateriaCurso.INACTIVO })
        .where('periodo_lectivo_id = :periodoId', { periodoId: id })
        .andWhere('estado = :estado', { estado: EstadoMateriaCurso.ACTIVO })
        .execute();

      // CURSOS = Cursos ACTIVOS -> INACTIVOS
      const resultCursos = await queryRunner.manager
        .createQueryBuilder()
        .update('cursos')
        .set({ estado: EstadoCurso.INACTIVO })
        .where('periodo_lectivo_id = :periodoId', { periodoId: id })
        .andWhere('estado = :estado', { estado: EstadoCurso.ACTIVO })
        .execute();

      // PERÍODO LECTIVO ACTIVO -> FINALIZADO
      await queryRunner.manager.update(
        PeriodoLectivo,
        { id },
        { estado: EstadoPeriodo.FINALIZADO }
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Período lectivo finalizado exitosamente',
        periodo: await this.findOne(id),
        estadisticas: {
          estudiantes_graduados: estudiantesGraduados,
          estudiantes_sin_matricula: estudiantesSinMatricula,
          matriculas_finalizadas: resultMatriculas.affected || 0,
          materias_curso_inactivadas: resultMateriasCurso.affected || 0,
          cursos_inactivados: resultCursos.affected || 0
        },
        advertencia: 'Esta acción es IRREVERSIBLE. No se puede reactivar un período finalizado.'
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  private async contarTrimestres(periodoId: string): Promise<number> {
    try {
      const trimestres = await this.trimestresService.findTrimestresByPeriodo(periodoId);
      return trimestres.length;
    } catch {
      return 0;
    }
  }
}