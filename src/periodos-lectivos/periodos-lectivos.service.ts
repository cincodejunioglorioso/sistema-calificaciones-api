import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePeriodoLectivoDto } from './dto/create-periodos-lectivo.dto';
import { UpdatePeriodoLectivoDto } from './dto/update-periodos-lectivo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoPeriodo, EstadoSupletorio, PeriodoLectivo } from './entities/periodos-lectivo.entity';
import { Not, Repository, DataSource, In } from 'typeorm';
import { TrimestresService } from '../trimestres/trimestres.service';
import { EstadoMatricula, Matricula } from '../matriculas/entities/matricula.entity';
import { Curso, EstadoCurso, NivelCurso } from '../cursos/entities/curso.entity';
import { EstadoEstudiante, Estudiante } from '../estudiantes/entities/estudiante.entity';
import { TrimestreEstado } from '../trimestres/entities/trimestre.entity';
import { PromedioPeriodoService } from '../promedio-periodo/promedio-periodo.service';
import { EstadoMateriaCurso, MateriaCurso } from '../materia-curso/entities/materia-curso.entity';
import { EstadoPromedioAnual, PromedioPeriodo } from '../promedio-periodo/entities/promedio-periodo.entity';
import { TipoCalificacion } from '../materias/entities/materia.entity';

@Injectable()
export class PeriodosLectivosService {

  constructor(
    @InjectRepository(PeriodoLectivo)
    private readonly periodoLectivoRepository: Repository<PeriodoLectivo>,
    @InjectRepository(PromedioPeriodo)
    private readonly promedioPeriodoRepository: Repository<PromedioPeriodo>,
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

    if (periodo.estado === EstadoPeriodo.FINALIZADO) {
      throw new BadRequestException('El período ya está finalizado');
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

    if (periodo.estado_supletorio !== EstadoSupletorio.CERRADO) {
      return {
        puede_cerrar: false,
        errores: [
          `Debe cerrar la fase de supletorios antes de finalizar el período. Estado actual: ${periodo.estado_supletorio}`
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

  // 👑 ADMIN: Finalizar período (ACTIVO → FINALIZADO)
  // 👑 ADMIN: Finalizar período (ACTIVO → FINALIZADO)
  async cambiarEstado(periodo_id: string) {
    const startTime = Date.now();
    const periodo = await this.findOne(periodo_id);

    if (periodo.estado === EstadoPeriodo.FINALIZADO) {
      throw new BadRequestException('El período ya está finalizado');
    }

    // Validar que los 3 trimestres estén finalizados
    const trimestres = await this.trimestresService.findTrimestresByPeriodo(periodo_id);
    const trimestresFinalizados = trimestres.filter(t => t.estado === TrimestreEstado.FINALIZADO);

    if (trimestresFinalizados.length !== 3) {
      throw new BadRequestException(
        `Debe finalizar los 3 trimestres antes de cerrar el período. Finalizados: ${trimestresFinalizados.length}/3`
      );
    }

    // ✅ Validar que la fase de supletorios esté CERRADA
    if (periodo.estado_supletorio !== EstadoSupletorio.CERRADO) {
      throw new BadRequestException(
        `Debe cerrar la fase de supletorios antes de finalizar el período. Fase actual: ${periodo.estado_supletorio}`
      );
    }

    // 🔥 TRANSACCIÓN: Actualizar estudiantes, matrículas, cursos y asignaciones
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let contadorGraduados = 0;
      let contadorSinMatricula = 0;

      // ================================================
      // 1️⃣ OBTENER TODAS LAS MATRÍCULAS ACTIVAS DEL PERÍODO
      // ================================================
      const matriculasActivas = await queryRunner.manager
        .createQueryBuilder(Matricula, 'matricula')
        .innerJoinAndSelect('matricula.curso', 'curso')
        .innerJoinAndSelect('matricula.estudiante', 'estudiante')
        .where('matricula.periodo_lectivo_id = :periodoId', { periodoId: periodo_id })
        .andWhere('matricula.estado = :estado', { estado: EstadoMatricula.ACTIVO })
        .andWhere('estudiante.estado = :estadoEstudiante', { estadoEstudiante: EstadoEstudiante.ACTIVO })
        .getMany();

      // ================================================
      // 2️⃣ PROCESAR ESTUDIANTES DE 3° BACHILLERATO (BATCH)
      // ================================================
      const matriculasTercero = matriculasActivas.filter(
        m => m.curso.nivel === NivelCurso.TERCERO_BACHILLERATO
      );

      // IDs de estudiantes que NO son de 3ro (para batch update después)
      const otrasMatriculas = matriculasActivas.filter(
        m => m.curso.nivel !== NivelCurso.TERCERO_BACHILLERATO
      );
      const idsEstudiantesOtros = [...new Set(otrasMatriculas.map(m => m.estudiante_id))];

      if (matriculasTercero.length > 0) {
        const estudiantesTerceroIds = matriculasTercero.map(m => m.estudiante_id);

        // 🔥 UNA SOLA QUERY: Obtener TODOS los promedios de todos los estudiantes de 3ro
        const todosPromedios = await queryRunner.manager
          .createQueryBuilder(PromedioPeriodo, 'pp')
          .innerJoin('pp.materia_curso', 'mc')
          .innerJoin('mc.materia', 'm')
          .where('pp.estudiante_id IN (:...ids)', { ids: estudiantesTerceroIds })
          .andWhere('pp.periodo_lectivo_id = :periodoId', { periodoId: periodo_id })
          .andWhere('m.tipoCalificacion = :tipo', { tipo: TipoCalificacion.CUANTITATIVA })
          .select([
            'pp.estudiante_id',
            'pp.promedio_anual',
            'pp.promedio_final',
            'pp.estado'
          ])
          .getMany();

        // 🔥 Agrupar por estudiante con Map O(1)
        const promediosPorEstudiante = new Map<string, PromedioPeriodo[]>();
        todosPromedios.forEach(p => {
          if (!promediosPorEstudiante.has(p.estudiante_id)) {
            promediosPorEstudiante.set(p.estudiante_id, []);
          }
          promediosPorEstudiante.get(p.estudiante_id)!.push(p);
        });

        // 🔥 Clasificar en memoria (0 queries adicionales)
        const idsAGraduar: string[] = [];
        const idsASinMatricula: string[] = [];

        for (const matricula of matriculasTercero) {
          const promedios = promediosPorEstudiante.get(matricula.estudiante_id) || [];

          // ✅ CORRECTO: Verificar promedio_final (incluye supletorio) o promedio_anual
          const todosAprobados = promedios.length > 0 &&
            promedios.every(p => {
              // Si tiene promedio_final (rindió supletorio), usar ese
              // Si no, usar promedio_anual (aprobó directo)
              const notaDecisiva = p.promedio_final !== null && p.promedio_final !== undefined
                ? Number(p.promedio_final)
                : Number(p.promedio_anual);
              return notaDecisiva >= 7.0;
            });

          if (todosAprobados) {
            idsAGraduar.push(matricula.estudiante_id);
          } else {
            idsASinMatricula.push(matricula.estudiante_id);
          }
        }

        // 🔥 BATCH UPDATE: Máximo 2 queries para TODOS los de 3ro
        if (idsAGraduar.length > 0) {
          await queryRunner.manager.update(
            Estudiante,
            { id: In(idsAGraduar) },
            { estado: EstadoEstudiante.GRADUADO }
          );
          contadorGraduados = idsAGraduar.length;
        }

        if (idsASinMatricula.length > 0) {
          await queryRunner.manager.update(
            Estudiante,
            { id: In(idsASinMatricula) },
            { estado: EstadoEstudiante.SIN_MATRICULA }
          );
          contadorSinMatricula += idsASinMatricula.length;
        }
      }

      // ================================================
      // 3️⃣ PROCESAR ESTUDIANTES QUE NO SON DE 3° BACHILLERATO (BATCH)
      // ================================================
      if (idsEstudiantesOtros.length > 0) {
        await queryRunner.manager.update(
          Estudiante,
          { id: In(idsEstudiantesOtros) },
          { estado: EstadoEstudiante.SIN_MATRICULA }
        );
        contadorSinMatricula += idsEstudiantesOtros.length;
      }

      // ================================================
      // 4️⃣ FINALIZAR TODAS LAS MATRÍCULAS ACTIVAS (ya es batch)
      // ================================================
      const resultMatriculas = await queryRunner.manager.update(
        Matricula,
        {
          periodo_lectivo_id: periodo_id,
          estado: EstadoMatricula.ACTIVO
        },
        { estado: EstadoMatricula.FINALIZADO }
      );

      // ================================================
      // 5️⃣ INACTIVAR ASIGNACIONES (MATERIA-CURSO) (ya es batch)
      // ================================================
      const resultMateriasCurso = await queryRunner.manager
        .createQueryBuilder()
        .update('materias_curso')
        .set({ estado: EstadoMateriaCurso.INACTIVO })
        .where('periodo_lectivo_id = :periodoId', { periodoId: periodo_id })
        .andWhere('estado = :estado', { estado: EstadoMateriaCurso.ACTIVO })
        .execute();

      // ================================================
      // 6️⃣ INACTIVAR CURSOS (ya es batch)
      // ================================================
      const resultCursos = await queryRunner.manager
        .createQueryBuilder()
        .update('cursos')
        .set({ estado: EstadoCurso.INACTIVO })
        .where('periodo_lectivo_id = :periodoId', { periodoId: periodo_id })
        .andWhere('estado = :estado', { estado: EstadoCurso.ACTIVO })
        .execute();

      // ================================================
      // 7️⃣ FINALIZAR PERÍODO LECTIVO (ya es batch)
      // ================================================
      await queryRunner.manager.update(
        PeriodoLectivo,
        { id: periodo_id },
        { estado: EstadoPeriodo.FINALIZADO }
      );

      await queryRunner.commitTransaction();

      const endTime = Date.now();
      const tiempoTotal = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`✅ Período finalizado en ${tiempoTotal} segundos`);
      console.log(`🎓 Graduados: ${contadorGraduados}`);
      console.log(`📋 Sin matrícula: ${contadorSinMatricula}`);

      return {
        message: `Período ${periodo.nombre} finalizado exitosamente`,
        periodo: await this.findOne(periodo_id),
        estadisticas: {
          estudiantes_graduados: contadorGraduados,
          estudiantes_sin_matricula: contadorSinMatricula,
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

  // 👑 ADMIN: Activar fase de supletorios
  async activarSupletorios(periodo_id: string) {
    const periodo = await this.findOne(periodo_id);

    // Validar que esté en estado ACTIVO
    if (periodo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException(
        `El período debe estar ACTIVO para activar supletorios. Estado actual: ${periodo.estado}`
      );
    }

    // Validar que NO esté ya en proceso de supletorios
    if (periodo.estado_supletorio !== EstadoSupletorio.PENDIENTE) {
      throw new BadRequestException(
        `Los supletorios ya están en fase ${periodo.estado_supletorio}`
      );
    }

    // Validar que los 3 trimestres estén FINALIZADO
    const trimestres = await this.trimestresService.findTrimestresByPeriodo(periodo_id);

    if (trimestres.length !== 3) {
      throw new BadRequestException('El período debe tener exactamente 3 trimestres');
    }

    const trimestresNoFinalizados = trimestres.filter(t => t.estado !== TrimestreEstado.FINALIZADO);

    if (trimestresNoFinalizados.length > 0) {
      throw new BadRequestException(
        `Los siguientes trimestres no están finalizados: ${trimestresNoFinalizados.map(t => t.nombre).join(', ')}`
      );
    }

    // Validar que existan promedios anuales generados
    const promediosCount = await this.promedioPeriodoRepository.count({
      where: { periodo_lectivo_id: periodo_id }
    });

    if (promediosCount === 0) {
      throw new BadRequestException(
        'No hay promedios anuales generados. Primero debe finalizar el tercer trimestre y generar los promedios.'
      );
    }

    // Contar estudiantes que necesitan supletorio
    const estudiantesSupletorio = await this.promedioPeriodoRepository
      .createQueryBuilder('pp')
      .innerJoin('pp.materia_curso', 'mc')
      .innerJoin('mc.materia', 'm')
      .where('pp.periodo_lectivo_id = :periodo_id', { periodo_id })
      .andWhere('pp.promedio_anual < 7.0')
      .andWhere('m.tipoCalificacion = :tipo', { tipo: TipoCalificacion.CUANTITATIVA })
      .getCount();

    // ✅ Cambiar SOLO la fase de supletorio (estado sigue ACTIVO)
    periodo.estado_supletorio = EstadoSupletorio.ACTIVADO;
    await this.periodoLectivoRepository.save(periodo);

    return {
      message: 'Fase de supletorios activada exitosamente',
      periodo,
      estadisticas: {
        total_promedios_generados: promediosCount,
        total_estudiantes_en_supletorio: estudiantesSupletorio,
        advertencia: 'Los docentes ahora pueden registrar calificaciones de exámenes supletorios'
      }
    };
  }

  // 👑 ADMIN: Cerrar fase de supletorios
  async cerrarSupletorios(periodo_id: string) {
    const periodo = await this.findOne(periodo_id);

    // Validar que esté en fase EN_PROCESO
    if (periodo.estado_supletorio !== EstadoSupletorio.ACTIVADO) {
      throw new BadRequestException(
        `Los supletorios deben estar EN_PROCESO. Fase actual: ${periodo.estado_supletorio}`
      );
    }

    // Contar estudiantes pendientes (con promedio_anual < 7 pero sin nota_supletorio)
    const estudiantesPendientes = await this.promedioPeriodoRepository
      .createQueryBuilder('pp')
      .innerJoin('pp.materia_curso', 'mc')
      .innerJoin('mc.materia', 'm')
      .where('pp.periodo_lectivo_id = :periodo_id', { periodo_id })
      .andWhere('pp.promedio_anual < 7.0')
      .andWhere('pp.nota_supletorio IS NULL')
      .andWhere('m.tipoCalificacion = :tipo', { tipo: TipoCalificacion.CUANTITATIVA })
      .getCount();

    // ⚠️ Advertir si hay pendientes (pero permitir cerrar igual)
    let advertencia: string | null = null;
    if (estudiantesPendientes > 0) {
      advertencia = `Hay ${estudiantesPendientes} estudiante(s) que no rindieron supletorio. Quedarán como REPROBADOS.`;
    }

    // Cambiar fase a CERRADO
    periodo.estado_supletorio = EstadoSupletorio.CERRADO;
    await this.periodoLectivoRepository.save(periodo);

    return {
      message: 'Fase de supletorios cerrada exitosamente',
      periodo,
      estadisticas: {
        estudiantes_pendientes: estudiantesPendientes,
        advertencia
      }
    };
  }

  // 👑 ADMIN: Reabrir supletorios
  async reabrirSupletorios(periodo_id: string) {
    const periodo = await this.findOne(periodo_id);

    // Validar que esté en fase CERRADO
    if (periodo.estado_supletorio !== EstadoSupletorio.CERRADO) {
      throw new BadRequestException(
        `Solo se pueden reabrir supletorios desde fase CERRADO. Fase actual: ${periodo.estado_supletorio}`
      );
    }

    // Validar que el período siga ACTIVO (no finalizado)
    if (periodo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException(
        `No se pueden reabrir supletorios en un período ${periodo.estado}`
      );
    }

    // Reabrir
    periodo.estado_supletorio = EstadoSupletorio.ACTIVADO;
    await this.periodoLectivoRepository.save(periodo);

    return {
      message: 'Supletorios reabiertos exitosamente',
      periodo
    };
  }

  // 👑 ADMIN: Regresar supletorios a PENDIENTE (ACTIVADO → PENDIENTE)
  async regresarSupletoriosPendiente(periodo_id: string) {
    const periodo = await this.findOne(periodo_id);

    // Validar que esté en estado ACTIVADO
    if (periodo.estado_supletorio !== EstadoSupletorio.ACTIVADO) {
      throw new BadRequestException(
        `Los supletorios deben estar ACTIVADOS para regresarlos a PENDIENTE. Estado actual: ${periodo.estado_supletorio}`
      );
    }

    // Validar que el período siga ACTIVO
    if (periodo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException(
        'No se pueden revertir supletorios de un período FINALIZADO'
      );
    }

    // Contar registros que se eliminarán
    const registrosAfectados = await this.promedioPeriodoRepository
      .createQueryBuilder('pp')
      .where('pp.periodo_lectivo_id = :periodo_id', { periodo_id })
      .andWhere('pp.nota_supletorio IS NOT NULL')
      .getCount();

    // Limpiar datos de supletorio
    await this.promedioPeriodoService.limpiarDatosSupletorioPorPeriodo(periodo_id);

    // Regresar a PENDIENTE
    periodo.estado_supletorio = EstadoSupletorio.PENDIENTE;
    await this.periodoLectivoRepository.save(periodo);

    return {
      message: 'Supletorios regresados a PENDIENTE exitosamente',
      periodo,
      estadisticas: {
        registros_eliminados: registrosAfectados,
        advertencia: 'Se han eliminado todas las calificaciones de supletorio registradas. Los docentes ya NO pueden calificar hasta que reactives los supletorios.'
      }
    };
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