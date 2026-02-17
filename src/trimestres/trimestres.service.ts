import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrimestreDto } from './dto/create-trimestre.dto';
import { UpdateTrimestreDto } from './dto/update-trimestre.dto';
import { NombreTrimestre, Trimestre, TrimestreEstado } from './entities/trimestre.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PeriodosLectivosService } from '../periodos-lectivos/periodos-lectivos.service';
import { EstadoPeriodo, EstadoSupletorio } from '../periodos-lectivos/entities/periodos-lectivo.entity';
import { InsumosService } from '../insumos/insumos.service';
import { PromedioTrimestreService } from '../promedio-trimestre/promedio-trimestre.service';
import { CalificacionExamen } from '../calificacion-examen/entities/calificacion-examen.entity';
import { CalificacionProyecto } from '../calificacion-proyecto/entities/calificacion-proyecto.entity';
import { Insumo, EstadoInsumo } from '../insumos/entities/insumo.entity';
import { Matricula, EstadoMatricula } from '../matriculas/entities/matricula.entity';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';
import { PromedioPeriodoService } from '../promedio-periodo/promedio-periodo.service';
import { ResultadoGeneracionPeriodoMasiva } from '../promedio-periodo/dto/resultado-generacion-masiva.interface';
import { EstadoEstudiante } from '../estudiantes/entities/estudiante.entity';
import { CalificacionCualitativaService } from '../calificacion-cualitativa/calificacion-cualitativa.service';
import { NivelEducativo } from '../materias/entities/materia.entity';
import { Curso } from '../cursos/entities/curso.entity';

@Injectable()
export class TrimestresService {
  constructor(
    @InjectRepository(Trimestre)
    private readonly trimestreRepository: Repository<Trimestre>,

    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,

    @InjectRepository(CalificacionExamen)
    private readonly calificacionExamenRepository: Repository<CalificacionExamen>,

    @InjectRepository(CalificacionProyecto)
    private readonly calificacionProyectoRepository: Repository<CalificacionProyecto>,

    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,

    @InjectRepository(MateriaCurso)
    private readonly materiaCursoRepository: Repository<MateriaCurso>,

    @InjectRepository(Curso)
    private readonly cursoRepository: Repository<Curso>,

    @Inject(forwardRef(() => PeriodosLectivosService))
    private readonly periodosLectivosService: PeriodosLectivosService,

    @Inject(forwardRef(() => InsumosService))
    private readonly insumoService: InsumosService,

    @Inject(forwardRef(() => PromedioTrimestreService))
    private readonly promedioTrimestreService: PromedioTrimestreService,

    @Inject(forwardRef(() => PromedioPeriodoService))
    private readonly promedioPeriodoService: PromedioPeriodoService,

    @Inject(forwardRef(() => CalificacionCualitativaService))
    private readonly calificacionCualitativaService: CalificacionCualitativaService,
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
        estado: TrimestreEstado.PENDIENTE,
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
      order: { nombre: 'ASC' }
    });
  }

  // 👑 ADMIN: Ver trimestres de un período específico
  async findTrimestresByPeriodo(periodoId: string) {
    return await this.trimestreRepository.find({
      where: { periodo_lectivo_id: periodoId },
      order: { nombre: 'ASC' }
    });
  }

  // 🌍 TODOS: Trimestre activo actual
  async findTrimestreActivo() {
    const trimestre = await this.trimestreRepository.findOne({
      where: { estado: TrimestreEstado.ACTIVO },
      order: { nombre: 'ASC' }
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


    // ✅ VALIDACIÓN 1: Si se está cambiando el estado desde FINALIZADO (REACTIVACIÓN)
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

      if (periodo.estado_supletorio !== EstadoSupletorio.PENDIENTE) {
        throw new BadRequestException(
          `No se puede reactivar el trimestre porque los supletorios están en estado ${periodo.estado_supletorio}. ` +
          `Primero debes regresar los supletorios a PENDIENTE desde la gestión del período.`
        );
      }
      // 1️⃣ Reabrir insumos cerrados
      const insumosReabiertos = await this.insumoService.reabrirInsumosDeTrimestre(id);

      // 2️⃣ Eliminar promedios trimestrales del trimestre reactivado
      const rollbackTrimestre = await this.promedioTrimestreService.rollbackPromediosTrimestre(id);

      // 3️⃣ Eliminar promedios periódicos relacionados
      const rollbackPeriodo = await this.promedioPeriodoService.rollbackPromediosPeriodo(trimestre.periodo_lectivo_id);

      // 4️⃣ Actualizar estado del trimestre
      await this.trimestreRepository.update(id, updateTrimestreDto);
      const trimestreReactivado = await this.findOne(id);

      return {
        message: 'Trimestre reactivado exitosamente. Todos los promedios relacionados han sido eliminados.',
        trimestre: trimestreReactivado,
        rollback: {
          insumos_reabiertos: insumosReabiertos.cantidad,
          promedios_trimestre_eliminados: rollbackTrimestre.eliminados,
          promedios_anuales_eliminados: rollbackPeriodo.eliminados
        },
        advertencia:
          'IMPORTANTE: Los promedios anuales también fueron eliminados porque dependen de que los 3 trimestres estén finalizados. ' +
          'Deberás finalizar nuevamente los 3 trimestres para regenerarlos.'
      };
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

    // Si se está FINALIZANDO el trimestre, validar y generar promedios automáticamente
    if (updateTrimestreDto.estado === TrimestreEstado.FINALIZADO &&
      trimestre.estado !== TrimestreEstado.FINALIZADO) {

      // Validar que se puede cerrar
      const validacion = await this.validarCierreTrimestre(id);

      if (!validacion.puede_cerrar) {
        throw new BadRequestException({
          message: validacion.mensaje_simple,
          resumen_por_docente: validacion.resumen_por_docente,
          estadisticas: validacion.estadisticas,
          errores_detallados: validacion.errores_detallados,
          recomendacion: 'Revisa los errores pendientes antes de cerrar el trimestre'
        });
      }

      // Cerrar todos los insumos
      await this.insumoService.cerrarInsumosDeTrimestre(id);

      // Realizar la actualización de estado
      await this.trimestreRepository.update(id, updateTrimestreDto);

      // Generar promedios automáticamente
      const resultadoPromediosTrimestre = await this.promedioTrimestreService.generarPromediosMasivo(id);

      const trimestreActualizado = await this.findOne(id);

      let resultadoPromediosPeriodo: ResultadoGeneracionPeriodoMasiva | null = null;
      if (trimestre.nombre === NombreTrimestre.TERCER_TRIMESTRE) {
        try {
          resultadoPromediosPeriodo = await this.promedioPeriodoService.generarPromediosMasivo(
            trimestre.periodo_lectivo_id
          );
        } catch (error) {
          // Log del error pero no fallar todo el proceso
          console.error('Error generando promedios anuales:', error);
        }
      }

      return {
        message: trimestre.nombre === NombreTrimestre.TERCER_TRIMESTRE
          ? 'Tercer trimestre finalizado exitosamente. Promedios anuales generados.'
          : 'Trimestre finalizado exitosamente',
        trimestre: trimestreActualizado,
        promedios_trimestre: {
          generados: resultadoPromediosTrimestre.total_generados,
          fallidos: resultadoPromediosTrimestre.total_fallidos,
          estudiantes_con_errores: resultadoPromediosTrimestre.estudiantes_incompletos
        },
        promedios_anuales: resultadoPromediosPeriodo ? {
          generados: resultadoPromediosPeriodo.total_generados,
          fallidos: resultadoPromediosPeriodo.total_fallidos,
          estudiantes_incompletos: resultadoPromediosPeriodo.estudiantes_incompletos
        } : null,
        advertencia: 'Los insumos han sido cerrados y no se pueden modificar'
      };
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

  async validarCierreTrimestre(trimestre_id: string) {
    const trimestre = await this.findOne(trimestre_id);

    if (trimestre.estado === TrimestreEstado.FINALIZADO) {
      throw new BadRequestException('El trimestre ya está finalizado');
    }

    const errores: any[] = [];
    const resumenDocentes: Map<string, {
      nombre: string;
      problemas: string[];
    }> = new Map();

    const agregarProblemaDocente = (docenteId: string, nombreDocente: string, problema: string) => {
      if (!resumenDocentes.has(docenteId)) {
        resumenDocentes.set(docenteId, {
          nombre: nombreDocente,
          problemas: []
        });
      }
      const docente = resumenDocentes.get(docenteId)!;
      if (!docente.problemas.includes(problema)) {
        docente.problemas.push(problema);
      }
    };

    // ============ 🔥 BATCH: Obtener cursos UNA VEZ ============
    const cursos = await this.cursoRepository.find({
      where: { periodo_lectivo_id: trimestre.periodo_lectivo_id },
      relations: ['docente']
    });

    const cursosIds = cursos.map(c => c.id);

    // ============ 🔥 BATCH: Todas las matrículas activas de UNA VEZ ============
    const todasMatriculas = cursosIds.length > 0
      ? await this.matriculaRepository.find({
        where: {
          curso_id: In(cursosIds),
          estado: EstadoMatricula.ACTIVO
        },
        relations: ['estudiante']
      })
      : [];

    // Crear maps para acceso rápido
    const matriculasPorCurso = new Map<string, Matricula[]>();
    const estudiantesUnicos = new Set<string>();
    const estudiantesInactivosUnicos = new Set<string>();

    for (const m of todasMatriculas) {
      if (m.estudiante.estado === EstadoEstudiante.INACTIVO_TEMPORAL) {
        estudiantesInactivosUnicos.add(m.estudiante_id);
      } else {
        estudiantesUnicos.add(m.estudiante_id);
        if (!matriculasPorCurso.has(m.curso_id)) {
          matriculasPorCurso.set(m.curso_id, []);
        }
        matriculasPorCurso.get(m.curso_id)!.push(m);
      }
    }

    const total_estudiantes = estudiantesUnicos.size;
    const estudiantes_inactivos = estudiantesInactivosUnicos.size;

    // ============ 🔥 BATCH: Todas las materias-curso de UNA VEZ ============
    const materiasCurso = await this.materiaCursoRepository.find({
      where: {
        curso: { periodo_lectivo_id: trimestre.periodo_lectivo_id }
      },
      relations: ['curso', 'materia', 'docente']
    });

    const materiasCuantitativas = materiasCurso.filter(
      mc => mc.materia.tipoCalificacion === 'CUANTITATIVA'
    );

    // ============ 🔥 BATCH: Todos los insumos del trimestre de UNA VEZ ============
    const materiasIds = materiasCuantitativas.map(mc => mc.id);

    const todosInsumos = materiasIds.length > 0
      ? await this.insumoRepository.find({
        where: {
          materia_curso_id: In(materiasIds),
          trimestre_id: trimestre_id
        }
      })
      : [];

    const insumosPorMateria = new Map<string, Insumo[]>();
    for (const ins of todosInsumos) {
      if (!insumosPorMateria.has(ins.materia_curso_id)) {
        insumosPorMateria.set(ins.materia_curso_id, []);
      }
      insumosPorMateria.get(ins.materia_curso_id)!.push(ins);
    }

    // ============ 🔥 BATCH: Todos los exámenes del trimestre de UNA VEZ ============
    const todosExamenes = materiasIds.length > 0
      ? await this.calificacionExamenRepository.find({
        where: {
          materia_curso_id: In(materiasIds),
          trimestre_id: trimestre_id
        },
        select: ['estudiante_id', 'materia_curso_id']
      })
      : [];

    const examenesSet = new Set(
      todosExamenes.map(e => `${e.estudiante_id}:${e.materia_curso_id}`)
    );

    // ============ 🔥 BATCH: Todos los proyectos del trimestre de UNA VEZ ============
    const todosProyectos = cursosIds.length > 0
      ? await this.calificacionProyectoRepository.find({
        where: {
          curso_id: In(cursosIds),
          trimestre_id: trimestre_id
        },
        select: ['estudiante_id', 'curso_id']
      })
      : [];

    const proyectosSet = new Set(
      todosProyectos.map(p => `${p.estudiante_id}:${p.curso_id}`)
    );

    // ============ VALIDAR MATERIAS-CURSO (en memoria) ============
    for (const materiaCurso of materiasCuantitativas) {
      const matriculasDelCurso = matriculasPorCurso.get(materiaCurso.curso_id) || [];

      // 1️⃣ VALIDAR INSUMOS
      const insumos = insumosPorMateria.get(materiaCurso.id) || [];
      const insumosNoPublicados = insumos.filter(i =>
        i.estado !== EstadoInsumo.PUBLICADO &&
        i.estado !== EstadoInsumo.CERRADO
      );

      if (insumosNoPublicados.length > 0 && materiaCurso.docente_id) {
        agregarProblemaDocente(
          materiaCurso.docente_id,
          `${materiaCurso.docente?.apellidos} ${materiaCurso.docente?.nombres}`,
          `${materiaCurso.materia.nombre} (${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}): ${insumosNoPublicados.length} insumo(s) sin publicar`
        );

        errores.push({
          tipo: 'INSUMO_SIN_PUBLICAR',
          docente_id: materiaCurso.docente_id,
          materia_curso: `${materiaCurso.materia.nombre} - ${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`,
          cantidad: insumosNoPublicados.length
        });
      }

      // 2️⃣ VALIDAR EXÁMENES (desde el Set, sin queries)
      const estudiantesSinExamen = matriculasDelCurso.filter(
        m => !examenesSet.has(`${m.estudiante_id}:${materiaCurso.id}`)
      );

      if (estudiantesSinExamen.length > 0 && materiaCurso.docente_id) {
        agregarProblemaDocente(
          materiaCurso.docente_id,
          `${materiaCurso.docente?.apellidos} ${materiaCurso.docente?.nombres}`,
          `${materiaCurso.materia.nombre} (${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}): ${estudiantesSinExamen.length} examen(es) sin calificar`
        );

        errores.push({
          tipo: 'ESTUDIANTE_SIN_EXAMEN',
          docente_id: materiaCurso.docente_id,
          materia_curso_id: materiaCurso.id,
          materia_curso: `${materiaCurso.materia.nombre} - ${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`,
          cantidad: estudiantesSinExamen.length
        });
      }
    }

    // 3️⃣ VALIDAR PROYECTOS (desde el Set, sin queries)
    const cursosValidados = new Set<string>();
    for (const curso of cursos) {
      if (cursosValidados.has(curso.id)) continue;
      cursosValidados.add(curso.id);

      const matriculasDelCurso = matriculasPorCurso.get(curso.id) || [];

      const estudiantesSinProyecto = matriculasDelCurso.filter(
        m => !proyectosSet.has(`${m.estudiante_id}:${curso.id}`)
      );

      if (estudiantesSinProyecto.length > 0 && curso.docente_id) {
        agregarProblemaDocente(
          curso.docente_id,
          `${curso.docente?.apellidos} ${curso.docente?.nombres}`,
          `Proyecto (${curso.nivel} ${curso.paralelo}): ${estudiantesSinProyecto.length} proyecto(s) sin calificar`
        );

        errores.push({
          tipo: 'ESTUDIANTE_SIN_PROYECTO',
          docente_id: curso.docente_id,
          curso_id: curso.id,
          curso: `${curso.nivel} ${curso.paralelo}`,
          cantidad: estudiantesSinProyecto.length
        });
      }

      // 4️⃣ VALIDAR COMPONENTES CUALITATIVOS (SOLO SI HAY TUTOR)
      if (!curso.docente_id) continue;

      const nivelesBasicos = ['OCTAVO', 'NOVENO', 'DECIMO'];
      const nivelEducativo = nivelesBasicos.includes(curso.nivel)
        ? NivelEducativo.BASICA
        : NivelEducativo.BACHILLERATO;

      const componentesCualitativos = await this.calificacionCualitativaService.obtenerComponentesPorNivel(nivelEducativo);

      if (componentesCualitativos.length > 0) {
        const todasCalificaciones = await this.calificacionCualitativaService.findByCursoYTrimestre(
          curso.id,
          trimestre_id
        );

        const estudiantesSinComponentes: string[] = [];

        for (const matricula of matriculasDelCurso) {
          const calificacionesDelEstudiante = todasCalificaciones.filter(
            cal => cal.estudiante_id === matricula.estudiante_id
          );

          const componentesCalificados = calificacionesDelEstudiante.filter(
            cal => cal.calificacion !== null
          ).length;

          if (componentesCalificados < componentesCualitativos.length) {
            estudiantesSinComponentes.push(matricula.estudiante.nombres_completos);
          }
        }

        if (estudiantesSinComponentes.length > 0) {
          agregarProblemaDocente(
            curso.docente_id,
            `${curso.docente?.apellidos} ${curso.docente?.nombres}`,
            `Componentes cualitativos (${curso.nivel} ${curso.paralelo}): ${estudiantesSinComponentes.length} estudiante(s) sin calificar completamente`
          );

          errores.push({
            tipo: 'COMPONENTE_CUALITATIVO_SIN_CALIFICAR',
            docente_id: curso.docente_id,
            curso_id: curso.id,
            curso: `${curso.nivel} ${curso.paralelo}`,
            cantidad: estudiantesSinComponentes.length
          });
        }
      }
    }

    // ✅ CALCULAR ESTUDIANTES COMPLETOS
    const totalErrores = errores.reduce((acc, e) => {
      if (e.tipo === 'ESTUDIANTE_SIN_EXAMEN' ||
        e.tipo === 'ESTUDIANTE_SIN_PROYECTO' ||
        e.tipo === 'COMPONENTE_CUALITATIVO_SIN_CALIFICAR') {
        return acc + e.cantidad;
      }
      return acc;
    }, 0);

    const estudiantes_incompletos = Math.min(totalErrores, total_estudiantes);
    const estudiantes_completos = total_estudiantes - estudiantes_incompletos;

    const puede_cerrar = errores.length === 0;

    const resumenSimplificado = Array.from(resumenDocentes.entries()).map(([id, data]) => ({
      docente_id: id,
      docente_nombre: data.nombre,
      total_problemas: data.problemas.length,
      problemas: data.problemas
    }));

    return {
      puede_cerrar,
      mensaje_simple: puede_cerrar
        ? 'El trimestre está listo para cerrarse'
        : `Se encontraron ${resumenSimplificado.length} docente(s) con calificaciones pendientes`,

      resumen_por_docente: resumenSimplificado,
      errores_detallados: errores,

      estadisticas: {
        total_estudiantes,
        estudiantes_completos,
        estudiantes_inactivos,
        estudiantes_incompletos,
        porcentaje_completado: total_estudiantes > 0
          ? ((estudiantes_completos / total_estudiantes) * 100).toFixed(2) + '%'
          : '0%'
      },

      preview_generacion: puede_cerrar ? {
        total_promedios_a_generar: estudiantes_completos * materiasCuantitativas.length,
        estimacion_tiempo: `${Math.ceil((estudiantes_completos * materiasCuantitativas.length) / 25)} segundos`,
        advertencia: 'Esta acción cerrará todos los insumos y no se podrán editar'
      } : null
    };
  }

  // Validar solapamiento de fechas
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
