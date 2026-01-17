import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrimestreDto } from './dto/create-trimestre.dto';
import { UpdateTrimestreDto } from './dto/update-trimestre.dto';
import { NombreTrimestre, Trimestre, TrimestreEstado } from './entities/trimestre.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PeriodosLectivosService } from '../periodos-lectivos/periodos-lectivos.service';
import { EstadoPeriodo } from '../periodos-lectivos/entities/periodos-lectivo.entity';
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

    @Inject(forwardRef(() => PeriodosLectivosService))
    private readonly periodosLectivosService: PeriodosLectivosService,

    @Inject(forwardRef(() => InsumosService))
    private readonly insumoService: InsumosService,

    @Inject(forwardRef(() => PromedioTrimestreService))
    private readonly promedioTrimestreService: PromedioTrimestreService,

    @Inject(forwardRef(() => PromedioPeriodoService))
    private readonly promedioPeriodoService: PromedioPeriodoService,
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
          message: 'No se puede finalizar el trimestre con errores pendientes',
          errores: validacion.errores,
          estadisticas: validacion.estadisticas,
          recomendacion: 'Usa el endpoint /validar-cierre primero para revisar los errores'
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

  /*   async validarCierreTrimestre(trimestre_id: string) {
      const trimestre = await this.findOne(trimestre_id);
  
      if (trimestre.estado === TrimestreEstado.FINALIZADO) {
        throw new BadRequestException('El trimestre ya está finalizado');
      }
  
      const errores: any[] = [];
      let total_estudiantes = 0;
      let estudiantes_completos = 0;
      let estudiantes_inactivos = 0;
  
      // Obtener todas las materias-curso del período
      const materiasCurso = await this.materiaCursoRepository.find({
        where: {
          curso: { periodo_lectivo_id: trimestre.periodo_lectivo_id }
        },
        relations: ['curso', 'materia', 'docente']
      });
  
      for (const materiaCurso of materiasCurso) {
        // Obtener estudiantes matriculados
        const matriculas = await this.matriculaRepository.find({
          where: {
            curso_id: materiaCurso.curso_id,
            estado: EstadoMatricula.ACTIVO
          },
          relations: ['estudiante']
        });
  
        const matriculasActivas = matriculas.filter(
          m => m.estudiante.estado !== EstadoEstudiante.INACTIVO_TEMPORAL
        );
  
        const matriculasInactivas = matriculas.filter(
          m => m.estudiante.estado === EstadoEstudiante.INACTIVO_TEMPORAL
        );
  
        total_estudiantes += matriculasActivas.length;
        estudiantes_inactivos += matriculasInactivas.length;
  
        // 1️⃣ VALIDAR INSUMOS
        const insumos = await this.insumoRepository.find({
          where: {
            materia_curso_id: materiaCurso.id,
            trimestre_id: trimestre_id
          }
        });
  
        const insumosNoPublicados = insumos.filter(i =>
          i.estado !== EstadoInsumo.PUBLICADO &&
          i.estado !== EstadoInsumo.CERRADO
        );
  
        if (insumosNoPublicados.length > 0) {
          errores.push({
            tipo: 'INSUMO_SIN_PUBLICAR',
            materia_curso: `${materiaCurso.materia.nombre} - ${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`,
            docente: materiaCurso.docente?.apellidos + ' ' + materiaCurso.docente?.nombres,
            cantidad: insumosNoPublicados.length,
            detalles: insumosNoPublicados.map(i => i.nombre)
          });
        }
  
        // 2️⃣ VALIDAR EXÁMENES
        for (const matricula of matriculasActivas) {
          const examen = await this.calificacionExamenRepository.findOne({
            where: {
              estudiante_id: matricula.estudiante_id,
              materia_curso_id: materiaCurso.id,
              trimestre_id: trimestre_id
            }
          });
  
          if (!examen) {
            const errorExistente = errores.find(
              e => e.tipo === 'ESTUDIANTE_SIN_EXAMEN' &&
                e.materia_curso_id === materiaCurso.id
            );
  
            if (errorExistente) {
              errorExistente.estudiantes_afectados.push(matricula.estudiante.nombres_completos);
              errorExistente.cantidad++;
            } else {
              errores.push({
                tipo: 'ESTUDIANTE_SIN_EXAMEN',
                materia_curso_id: materiaCurso.id,
                materia_curso: `${materiaCurso.materia.nombre} - ${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`,
                docente: materiaCurso.docente?.apellidos + ' ' + materiaCurso.docente?.nombres,
                estudiantes_afectados: [matricula.estudiante.nombres_completos],
                cantidad: 1
              });
            }
          }
        }
  
        // 3️⃣ VALIDAR PROYECTOS (por curso, no por materia)
        const proyectos = await this.calificacionProyectoRepository.find({
          where: {
            curso_id: materiaCurso.curso_id,
            trimestre_id: trimestre_id
          }
        });
  
        const estudiantesSinProyecto = matriculasActivas.filter(m =>
          !proyectos.some(p => p.estudiante_id === m.estudiante_id)
        );
  
        if (estudiantesSinProyecto.length > 0) {
          const errorExistente = errores.find(
            e => e.tipo === 'ESTUDIANTE_SIN_PROYECTO' &&
              e.curso_id === materiaCurso.curso_id
          );
  
          if (!errorExistente) {
            errores.push({
              tipo: 'ESTUDIANTE_SIN_PROYECTO',
              curso_id: materiaCurso.curso_id,
              curso: `${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`,
              tutor: materiaCurso.curso.docente?.apellidos + ' ' + materiaCurso.curso.docente?.nombres,
              estudiantes_afectados: estudiantesSinProyecto.map(m => m.estudiante.nombres_completos),
              cantidad: estudiantesSinProyecto.length
            });
          }
        }
      }
  
      estudiantes_completos = total_estudiantes - errores.reduce((acc, e) => {
        if (e.tipo === 'ESTUDIANTE_SIN_EXAMEN' || e.tipo === 'ESTUDIANTE_SIN_PROYECTO') {
          return acc + e.cantidad;
        }
        return acc;
      }, 0);
  
      const puede_cerrar = errores.length === 0;
  
      return {
        puede_cerrar,
        errores,
        estadisticas: {
          total_estudiantes,
          estudiantes_completos,
          estudiantes_inactivos,
          estudiantes_incompletos: total_estudiantes - estudiantes_completos,
          porcentaje_completado: total_estudiantes > 0
            ? ((estudiantes_completos / total_estudiantes) * 100).toFixed(2) + '%'
            : '0%'
        },
        preview_generacion: puede_cerrar ? {
          total_promedios_a_generar: estudiantes_completos * materiasCurso.length,
          estimacion_tiempo: `${Math.ceil((estudiantes_completos * materiasCurso.length) / 25)} segundos`,
          advertencia: 'Esta acción cerrará todos los insumos y no se podrán editar'
        } : null
      };
    } */

  async validarCierreTrimestre(trimestre_id: string) {
    const trimestre = await this.findOne(trimestre_id);

    console.log('🔍 [VALIDAR CIERRE] Iniciando validación para trimestre:', trimestre.nombre);

    if (trimestre.estado === TrimestreEstado.FINALIZADO) {
      throw new BadRequestException('El trimestre ya está finalizado');
    }

    const errores: any[] = [];
    let total_estudiantes = 0;
    let estudiantes_completos = 0;
    let estudiantes_inactivos = 0;

    // Obtener todas las materias-curso del período
    const materiasCurso = await this.materiaCursoRepository.find({
      where: {
        curso: { periodo_lectivo_id: trimestre.periodo_lectivo_id }
      },
      relations: ['curso', 'materia', 'docente']
    });

    console.log(`📚 [VALIDAR CIERRE] Total materias-curso encontradas: ${materiasCurso.length}`);

    for (const materiaCurso of materiasCurso) {
      console.log(`\n📖 [VALIDAR CIERRE] Procesando: ${materiaCurso.materia.nombre} - ${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`);

      // Obtener estudiantes matriculados
      const matriculas = await this.matriculaRepository.find({
        where: {
          curso_id: materiaCurso.curso_id,
          estado: EstadoMatricula.ACTIVO
        },
        relations: ['estudiante']
      });

      console.log(`   👥 Total matrículas ACTIVAS: ${matriculas.length}`);

      const matriculasActivas = matriculas.filter(
        m => m.estudiante.estado !== EstadoEstudiante.INACTIVO_TEMPORAL
      );

      const matriculasInactivas = matriculas.filter(
        m => m.estudiante.estado === EstadoEstudiante.INACTIVO_TEMPORAL
      );

      console.log(`   ✅ Estudiantes ACTIVOS: ${matriculasActivas.length}`);
      console.log(`   ⏸️  Estudiantes INACTIVO_TEMPORAL: ${matriculasInactivas.length}`);

      if (matriculasInactivas.length > 0) {
        console.log(`   ⚠️  Estudiantes inactivos ignorados: ${matriculasInactivas.map(m => m.estudiante.nombres_completos).join(', ')}`);
      }

      total_estudiantes += matriculasActivas.length;
      estudiantes_inactivos += matriculasInactivas.length;

      // 1️⃣ VALIDAR INSUMOS
      const insumos = await this.insumoRepository.find({
        where: {
          materia_curso_id: materiaCurso.id,
          trimestre_id: trimestre_id
        }
      });

      console.log(`   📝 Total insumos: ${insumos.length}`);
      console.log(`   📊 Estados insumos:`, insumos.map(i => `${i.nombre}=${i.estado}`).join(', '));

      const insumosNoPublicados = insumos.filter(i =>
        i.estado !== EstadoInsumo.PUBLICADO &&
        i.estado !== EstadoInsumo.CERRADO
      );

      if (insumosNoPublicados.length > 0) {
        console.log(`   ❌ INSUMOS SIN PUBLICAR: ${insumosNoPublicados.map(i => i.nombre).join(', ')}`);
        errores.push({
          tipo: 'INSUMO_SIN_PUBLICAR',
          materia_curso: `${materiaCurso.materia.nombre} - ${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`,
          docente: materiaCurso.docente?.apellidos + ' ' + materiaCurso.docente?.nombres,
          cantidad: insumosNoPublicados.length,
          detalles: insumosNoPublicados.map(i => i.nombre)
        });
      }

      // 2️⃣ VALIDAR EXÁMENES (solo estudiantes ACTIVOS)
      console.log(`   🧪 Validando exámenes de ${matriculasActivas.length} estudiantes ACTIVOS...`);

      for (const matricula of matriculasActivas) {
        const examen = await this.calificacionExamenRepository.findOne({
          where: {
            estudiante_id: matricula.estudiante_id,
            materia_curso_id: materiaCurso.id,
            trimestre_id: trimestre_id
          }
        });

        if (!examen) {
          console.log(`   ❌ Estudiante SIN EXAMEN: ${matricula.estudiante.nombres_completos} (${matricula.estudiante.estado})`);

          const errorExistente = errores.find(
            e => e.tipo === 'ESTUDIANTE_SIN_EXAMEN' &&
              e.materia_curso_id === materiaCurso.id
          );

          if (errorExistente) {
            errorExistente.estudiantes_afectados.push(matricula.estudiante.nombres_completos);
            errorExistente.cantidad++;
          } else {
            errores.push({
              tipo: 'ESTUDIANTE_SIN_EXAMEN',
              materia_curso_id: materiaCurso.id,
              materia_curso: `${materiaCurso.materia.nombre} - ${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`,
              docente: materiaCurso.docente?.apellidos + ' ' + materiaCurso.docente?.nombres,
              estudiantes_afectados: [matricula.estudiante.nombres_completos],
              cantidad: 1
            });
          }
        }
      }

      // 3️⃣ VALIDAR PROYECTOS (por curso, no por materia - solo estudiantes ACTIVOS)
      const proyectos = await this.calificacionProyectoRepository.find({
        where: {
          curso_id: materiaCurso.curso_id,
          trimestre_id: trimestre_id
        }
      });

      console.log(`   🎯 Total proyectos en curso: ${proyectos.length}`);

      const estudiantesSinProyecto = matriculasActivas.filter(m =>
        !proyectos.some(p => p.estudiante_id === m.estudiante_id)
      );

      if (estudiantesSinProyecto.length > 0) {
        console.log(`   ❌ Estudiantes SIN PROYECTO: ${estudiantesSinProyecto.map(m => `${m.estudiante.nombres_completos} (${m.estudiante.estado})`).join(', ')}`);

        const errorExistente = errores.find(
          e => e.tipo === 'ESTUDIANTE_SIN_PROYECTO' &&
            e.curso_id === materiaCurso.curso_id
        );

        if (!errorExistente) {
          errores.push({
            tipo: 'ESTUDIANTE_SIN_PROYECTO',
            curso_id: materiaCurso.curso_id,
            curso: `${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`,
            tutor: materiaCurso.curso.docente?.apellidos + ' ' + materiaCurso.curso.docente?.nombres,
            estudiantes_afectados: estudiantesSinProyecto.map(m => m.estudiante.nombres_completos),
            cantidad: estudiantesSinProyecto.length
          });
        }
      }
    }

    estudiantes_completos = total_estudiantes - errores.reduce((acc, e) => {
      if (e.tipo === 'ESTUDIANTE_SIN_EXAMEN' || e.tipo === 'ESTUDIANTE_SIN_PROYECTO') {
        return acc + e.cantidad;
      }
      return acc;
    }, 0);

    const puede_cerrar = errores.length === 0;

    console.log('\n📊 [VALIDAR CIERRE] RESUMEN FINAL:');
    console.log(`   ✅ Total estudiantes ACTIVOS: ${total_estudiantes}`);
    console.log(`   ⏸️  Total estudiantes INACTIVOS: ${estudiantes_inactivos}`);
    console.log(`   ✔️  Estudiantes completos: ${estudiantes_completos}`);
    console.log(`   ❌ Total errores encontrados: ${errores.length}`);
    console.log(`   🚦 Puede cerrar: ${puede_cerrar ? 'SÍ ✅' : 'NO ❌'}`);

    if (errores.length > 0) {
      console.log('\n🔴 [ERRORES DETALLADOS]:');
      errores.forEach((error, idx) => {
        console.log(`   ${idx + 1}. Tipo: ${error.tipo}`);
        console.log(`      Detalles:`, JSON.stringify(error, null, 2));
      });
    }

    return {
      puede_cerrar,
      errores,
      estadisticas: {
        total_estudiantes,
        estudiantes_completos,
        estudiantes_inactivos,
        estudiantes_incompletos: total_estudiantes - estudiantes_completos,
        porcentaje_completado: total_estudiantes > 0
          ? ((estudiantes_completos / total_estudiantes) * 100).toFixed(2) + '%'
          : '0%'
      },
      preview_generacion: puede_cerrar ? {
        total_promedios_a_generar: estudiantes_completos * materiasCurso.length,
        estimacion_tiempo: `${Math.ceil((estudiantes_completos * materiasCurso.length) / 25)} segundos`,
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
