// nest-backend/src/promedio-trimestre/promedio-trimestre.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PromedioTrimestre } from './entities/promedio-trimestre.entity';
import { CreatePromedioTrimestreDto } from './dto/create-promedio-trimestre.dto';
import { UpdatePromedioTrimestreDto } from './dto/update-promedio-trimestre.dto';
import { CalificacionInsumo } from '../calificacion_insumo/entities/calificacion_insumo.entity';
import { CalificacionProyecto } from '../calificacion-proyecto/entities/calificacion-proyecto.entity';
import { CalificacionExamen } from '../calificacion-examen/entities/calificacion-examen.entity';
import { Matricula, EstadoMatricula } from '../matriculas/entities/matricula.entity';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';
import { Trimestre, TrimestreEstado } from '../trimestres/entities/trimestre.entity';
import { TipoEvaluacion, NombreTipoEvaluacion } from '../tipos-evaluacion/entities/tipos-evaluacion.entity';
import { Insumo, EstadoInsumo } from '../insumos/entities/insumo.entity';
import { ResultadoGeneracionMasiva, EstudianteIncompleto } from './dto/resultado-generacion-masiva.interface';
import { calcularConversionCualitativa } from '../common/constants/escalas.constants';
import { EstadoEstudiante } from '../estudiantes/entities/estudiante.entity';
import { TipoCalificacion } from '../materias/entities/materia.entity';

@Injectable()
export class PromedioTrimestreService {
  constructor(
    @InjectRepository(PromedioTrimestre)
    private readonly promedioTrimestreRepository: Repository<PromedioTrimestre>,
    @InjectRepository(CalificacionInsumo)
    private readonly calificacionInsumoRepository: Repository<CalificacionInsumo>,
    @InjectRepository(CalificacionProyecto)
    private readonly calificacionProyectoRepository: Repository<CalificacionProyecto>,
    @InjectRepository(CalificacionExamen)
    private readonly calificacionExamenRepository: Repository<CalificacionExamen>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    @InjectRepository(MateriaCurso)
    private readonly materiaCursoRepository: Repository<MateriaCurso>,
    @InjectRepository(Trimestre)
    private readonly trimestreRepository: Repository<Trimestre>,
    @InjectRepository(TipoEvaluacion)
    private readonly tipoEvaluacionRepository: Repository<TipoEvaluacion>,
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
  ) { }

  async create(createPromedioTrimestreDto: CreatePromedioTrimestreDto) {
    const { estudiante_id, materia_curso_id, trimestre_id } = createPromedioTrimestreDto;

    const existente = await this.promedioTrimestreRepository.findOne({
      where: { estudiante_id, materia_curso_id, trimestre_id }
    });

    if (existente) {
      throw new BadRequestException('Ya existe un promedio trimestral para este estudiante en esta materia-trimestre');
    }

    const materiaCurso = await this.materiaCursoRepository.findOne({
      where: { id: materia_curso_id },
      relations: ['curso', 'curso.periodo_lectivo']
    });

    if (!materiaCurso) {
      throw new NotFoundException('Materia-Curso no encontrada');
    }

    const trimestre = await this.trimestreRepository.findOne({
      where: { id: trimestre_id }
    });

    if (!trimestre) {
      throw new NotFoundException('Trimestre no encontrado');
    }

    if (trimestre.estado !== TrimestreEstado.FINALIZADO) {
      throw new BadRequestException('Solo se pueden generar promedios de trimestres finalizados');
    }

    const matricula = await this.matriculaRepository.findOne({
      where: {
        estudiante_id,
        curso_id: materiaCurso.curso_id,
        estado: EstadoMatricula.ACTIVO
      }
    });

    if (!matricula) {
      throw new BadRequestException('El estudiante no está matriculado en el curso de esta materia');
    }

    const tiposEvaluacion = await this.tipoEvaluacionRepository.find({
      where: { periodo_lectivo_id: trimestre.periodo_lectivo_id }
    });

    const porcentajeInsumos = tiposEvaluacion.find(t => t.nombre === NombreTipoEvaluacion.INSUMOS)?.porcentaje || 70;
    const porcentajeProyecto = tiposEvaluacion.find(t => t.nombre === NombreTipoEvaluacion.PROYECTO)?.porcentaje || 15;
    const porcentajeExamen = tiposEvaluacion.find(t => t.nombre === NombreTipoEvaluacion.EXAMEN)?.porcentaje || 15;

    const insumosData = await this.calcularPromedioInsumos(estudiante_id, materia_curso_id, trimestre_id);

    if (!insumosData) {
      throw new BadRequestException('El estudiante no tiene insumos calificados en esta materia-trimestre');
    }

    const rawPonderadoInsumos = insumosData.promedio * (porcentajeInsumos / 100);

    const proyectoData = await this.obtenerNotaProyecto(estudiante_id, materiaCurso.curso_id, trimestre_id);
    if (proyectoData === null || proyectoData === undefined) {
      throw new BadRequestException('El estudiante no tiene calificación de proyecto integrador en este trimestre');
    }
    const rawPonderadoProyecto = proyectoData * (porcentajeProyecto / 100);

    const examenData = await this.obtenerNotaExamen(estudiante_id, materia_curso_id, trimestre_id);
    if (examenData === null || examenData === undefined) {
      throw new BadRequestException('El estudiante no tiene calificación de examen en esta materia-trimestre');
    }
    const rawPonderadoExamen = examenData * (porcentajeExamen / 100);

    const sumaExacta = rawPonderadoInsumos + rawPonderadoProyecto + rawPonderadoExamen;

    const nota_final_trimestre = Math.round(sumaExacta * 100) / 100;
    const ponderado_insumos = Math.round(rawPonderadoInsumos * 100) / 100;
    const ponderado_proyecto = Math.round(rawPonderadoProyecto * 100) / 100;
    const ponderado_examen = Math.round(rawPonderadoExamen * 100) / 100;

    const cualitativa = calcularConversionCualitativa(nota_final_trimestre);

    const promedio = this.promedioTrimestreRepository.create({
      estudiante_id,
      materia_curso_id,
      trimestre_id,
      promedio_insumos: insumosData.promedio,
      ponderado_insumos,
      nota_proyecto: proyectoData,
      ponderado_proyecto,
      nota_examen: examenData,
      ponderado_examen,
      nota_final_trimestre,
      cualitativa,
      observaciones: createPromedioTrimestreDto.observaciones
    });

    return await this.promedioTrimestreRepository.save(promedio);
  }

  private async calcularPromedioInsumos(estudiante_id: string, materia_curso_id: string, trimestre_id: string) {
    const calificaciones = await this.calificacionInsumoRepository
      .createQueryBuilder('ci')
      .innerJoin('ci.insumo', 'ins')
      .where('ci.estudiante_id = :estudiante_id', { estudiante_id })
      .andWhere('ins.materia_curso_id = :materia_curso_id', { materia_curso_id })
      .andWhere('ins.trimestre_id = :trimestre_id', { trimestre_id })
      .andWhere('ins.estado = :estado', { estado: EstadoInsumo.CERRADO })
      .select('AVG(ci.nota_final)', 'promedio')
      .addSelect('COUNT(ci.id)', 'total')
      .getRawOne();

    if (!calificaciones || calificaciones.total === '0') {
      return null;
    }

    return {
      promedio: Number(Number(calificaciones.promedio).toFixed(2)),
      total: parseInt(calificaciones.total)
    };
  }

  private async obtenerNotaProyecto(estudiante_id: string, curso_id: string, trimestre_id: string) {
    const calificacion = await this.calificacionProyectoRepository.findOne({
      where: { estudiante_id, curso_id, trimestre_id }
    });

    return calificacion ? Number(calificacion.calificacion_proyecto) : null;
  }

  private async obtenerNotaExamen(estudiante_id: string, materia_curso_id: string, trimestre_id: string) {
    const calificacion = await this.calificacionExamenRepository.findOne({
      where: { estudiante_id, materia_curso_id, trimestre_id }
    });

    return calificacion ? Number(calificacion.calificacion_examen) : null;
  }

  /**
   * 🚀 OPTIMIZADO: Generación masiva con batch processing
   * Reduce 3,000+ queries → ~10 queries
   */
  async generarPromediosMasivo(trimestre_id: string): Promise<ResultadoGeneracionMasiva> {
    const startTime = Date.now();

    const trimestre = await this.trimestreRepository.findOne({
      where: { id: trimestre_id },
      relations: ['periodo_lectivo']
    });

    if (!trimestre) {
      throw new NotFoundException('Trimestre no encontrado');
    }

    if (trimestre.estado !== TrimestreEstado.FINALIZADO) {
      throw new BadRequestException('Solo se pueden generar promedios de trimestres finalizados');
    }

    const resultado: ResultadoGeneracionMasiva = {
      total_procesados: 0,
      total_generados: 0,
      total_fallidos: 0,
      estudiantes_incompletos: []
    };

    // 🔥 OPTIMIZACIÓN 1: Traer todas las materias-curso de una vez
    const materiasCurso = await this.materiaCursoRepository.find({
      where: {
        curso: { periodo_lectivo_id: trimestre.periodo_lectivo_id }
      },
      relations: ['curso', 'materia']
    });

    const materiasCuantitativas = materiasCurso.filter(
      mc => mc.materia.tipoCalificacion === TipoCalificacion.CUANTITATIVA
    );

    if (materiasCuantitativas.length === 0) {
      return resultado;
    }

    // 🔥 OPTIMIZACIÓN 2: Obtener tipos de evaluación UNA VEZ
    const tiposEvaluacion = await this.tipoEvaluacionRepository.find({
      where: { periodo_lectivo_id: trimestre.periodo_lectivo_id }
    });

    const porcentajeInsumos = tiposEvaluacion.find(t => t.nombre === NombreTipoEvaluacion.INSUMOS)?.porcentaje || 70;
    const porcentajeProyecto = tiposEvaluacion.find(t => t.nombre === NombreTipoEvaluacion.PROYECTO)?.porcentaje || 15;
    const porcentajeExamen = tiposEvaluacion.find(t => t.nombre === NombreTipoEvaluacion.EXAMEN)?.porcentaje || 15;

    // 🔥 OPTIMIZACIÓN 3: Obtener IDs de todos los cursos
    const cursosIds = [...new Set(materiasCuantitativas.map(mc => mc.curso_id))];

    // 🔥 OPTIMIZACIÓN 4: Batch query - Todas las matrículas activas
    const matriculas = await this.matriculaRepository.find({
      where: {
        curso_id: In(cursosIds),
        estado: EstadoMatricula.ACTIVO
      },
      relations: ['estudiante']
    });

    const matriculasActivas = matriculas.filter(
      m => m.estudiante.estado !== EstadoEstudiante.INACTIVO_TEMPORAL
    );

    // 🔥 OPTIMIZACIÓN 5: Batch query - Promedios ya existentes
    const materiasIds = materiasCuantitativas.map(mc => mc.id);
    const estudiantesIds = matriculasActivas.map(m => m.estudiante_id);

    const promediosExistentes = await this.promedioTrimestreRepository.find({
      where: {
        materia_curso_id: In(materiasIds),
        estudiante_id: In(estudiantesIds),
        trimestre_id
      },
      select: ['estudiante_id', 'materia_curso_id']
    });

    const yaExistenSet = new Set(
      promediosExistentes.map(p => `${p.estudiante_id}:${p.materia_curso_id}`)
    );

    // 🔥 OPTIMIZACIÓN 6: Batch query - Todos los promedios de insumos
    const insumosPromedios = await this.calificacionInsumoRepository
      .createQueryBuilder('ci')
      .innerJoin('ci.insumo', 'ins')
      .where('ins.materia_curso_id IN (:...materiasIds)', { materiasIds })
      .andWhere('ins.trimestre_id = :trimestre_id', { trimestre_id })
      .andWhere('ins.estado = :estado', { estado: EstadoInsumo.CERRADO })
      .andWhere('ci.estudiante_id IN (:...estudiantesIds)', { estudiantesIds })
      .select('ci.estudiante_id', 'estudiante_id')
      .addSelect('ins.materia_curso_id', 'materia_curso_id')
      .addSelect('AVG(ci.nota_final)', 'promedio')
      .addSelect('COUNT(ci.id)', 'total')
      .groupBy('ci.estudiante_id')
      .addGroupBy('ins.materia_curso_id')
      .getRawMany();

    const insumosMap = new Map<string, number>();
    insumosPromedios.forEach(item => {
      const key = `${item.estudiante_id}:${item.materia_curso_id}`;
      insumosMap.set(key, Number(Number(item.promedio).toFixed(2)));
    });

    // 🔥 OPTIMIZACIÓN 7: Batch query - Todas las calificaciones de proyectos
    const proyectos = await this.calificacionProyectoRepository.find({
      where: {
        curso_id: In(cursosIds),
        trimestre_id,
        estudiante_id: In(estudiantesIds)
      },
      select: ['estudiante_id', 'curso_id', 'calificacion_proyecto']
    });

    const proyectosMap = new Map<string, number>();
    proyectos.forEach(p => {
      const key = `${p.estudiante_id}:${p.curso_id}`;
      proyectosMap.set(key, Number(p.calificacion_proyecto));
    });

    // 🔥 OPTIMIZACIÓN 8: Batch query - Todas las calificaciones de exámenes
    const examenes = await this.calificacionExamenRepository.find({
      where: {
        materia_curso_id: In(materiasIds),
        trimestre_id,
        estudiante_id: In(estudiantesIds)
      },
      select: ['estudiante_id', 'materia_curso_id', 'calificacion_examen']
    });

    const examenesMap = new Map<string, number>();
    examenes.forEach(e => {
      const key = `${e.estudiante_id}:${e.materia_curso_id}`;
      examenesMap.set(key, Number(e.calificacion_examen));
    });

    // 🔥 OPTIMIZACIÓN 9: Procesar en memoria y guardar en batch
    const promediosACrear: PromedioTrimestre[] = [];
    const BATCH_SIZE = 100; // Guardar cada 100 registros

    for (const materiaCurso of materiasCuantitativas) {
      const matriculasDelCurso = matriculasActivas.filter(m => m.curso_id === materiaCurso.curso_id);

      for (const matricula of matriculasDelCurso) {
        resultado.total_procesados++;

        const key = `${matricula.estudiante_id}:${materiaCurso.id}`;

        // Skip si ya existe
        if (yaExistenSet.has(key)) {
          continue;
        }

        try {
          // Obtener datos desde los Maps (en memoria)
          const promedioInsumos = insumosMap.get(key);
          if (!promedioInsumos) {
            throw new Error('No tiene insumos calificados');
          }

          const proyectoKey = `${matricula.estudiante_id}:${materiaCurso.curso_id}`;
          const notaProyecto = proyectosMap.get(proyectoKey);
          if (notaProyecto === undefined) {
            throw new Error('No tiene calificación de proyecto');
          }

          const notaExamen = examenesMap.get(key);
          if (notaExamen === undefined) {
            throw new Error('No tiene calificación de examen');
          }

          // Calcular promedios
          const rawPonderadoInsumos = promedioInsumos * (porcentajeInsumos / 100);
          const rawPonderadoProyecto = notaProyecto * (porcentajeProyecto / 100);
          const rawPonderadoExamen = notaExamen * (porcentajeExamen / 100);
          const sumaExacta = rawPonderadoInsumos + rawPonderadoProyecto + rawPonderadoExamen;

          const nota_final_trimestre = Math.round(sumaExacta * 100) / 100;
          const ponderado_insumos = Math.round(rawPonderadoInsumos * 100) / 100;
          const ponderado_proyecto = Math.round(rawPonderadoProyecto * 100) / 100;
          const ponderado_examen = Math.round(rawPonderadoExamen * 100) / 100;

          const cualitativa = calcularConversionCualitativa(nota_final_trimestre);

          const promedio = this.promedioTrimestreRepository.create({
            estudiante_id: matricula.estudiante_id,
            materia_curso_id: materiaCurso.id,
            trimestre_id,
            promedio_insumos: promedioInsumos,
            ponderado_insumos,
            nota_proyecto: notaProyecto,
            ponderado_proyecto,
            nota_examen: notaExamen,
            ponderado_examen,
            nota_final_trimestre,
            cualitativa
          });

          promediosACrear.push(promedio);

          // 🔥 Guardar en batches para evitar overhead de memoria
          if (promediosACrear.length >= BATCH_SIZE) {
            await this.promedioTrimestreRepository.save(promediosACrear);
            resultado.total_generados += promediosACrear.length;
            promediosACrear.length = 0; // Vaciar array
          }

        } catch (error) {
          resultado.total_fallidos++;
          resultado.estudiantes_incompletos.push({
            estudiante: matricula.estudiante.nombres_completos,
            estudiante_cedula: matricula.estudiante.estudiante_cedula,
            materia: materiaCurso.materia.nombre,
            curso: `${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`,
            error: error.message
          });
        }
      }
    }

    // 🔥 Guardar el último batch si quedaron registros
    if (promediosACrear.length > 0) {
      await this.promedioTrimestreRepository.save(promediosACrear);
      resultado.total_generados += promediosACrear.length;
    }

    const endTime = Date.now();
    const tiempoTotal = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Promedios trimestrales generados en ${tiempoTotal} segundos`);
    console.log(`📊 Total procesados: ${resultado.total_procesados}`);
    console.log(`✅ Total generados: ${resultado.total_generados}`);
    console.log(`❌ Total fallidos: ${resultado.total_fallidos}`);

    return resultado;
  }

  // ROLLBACK DE PROMEDIOS TRIMESTRALES
  async rollbackPromediosTrimestre(trimestre_id: string) {
    const promedios = await this.promedioTrimestreRepository.find({
      where: { trimestre_id }
    });

    if (promedios.length === 0) {
      return {
        eliminados: 0,
        mensaje: 'No había promedios trimestrales para eliminar'
      };
    }

    await this.promedioTrimestreRepository.remove(promedios);

    return {
      eliminados: promedios.length,
      mensaje: `${promedios.length} promedios trimestrales eliminados. Se regenerarán al finalizar el trimestre nuevamente.`
    };
  }

  async findAll() {
    return await this.promedioTrimestreRepository.find({
      order: {
        trimestre: { nombre: 'ASC' },
        estudiante: { nombres_completos: 'ASC' }
      }
    });
  }

  async findOne(id: string) {
    const promedio = await this.promedioTrimestreRepository.findOne({
      where: { id }
    });

    if (!promedio) {
      throw new NotFoundException('Promedio trimestral no encontrado');
    }

    return promedio;
  }

  async findByEstudiante(estudiante_id: string) {
    return await this.promedioTrimestreRepository.find({
      where: { estudiante_id },
      order: {
        trimestre: { nombre: 'ASC' },
        materia_curso: { materia: { nombre: 'ASC' } }
      }
    });
  }

  async findByMateriaCursoYTrimestre(materia_curso_id: string, trimestre_id: string) {
    return await this.promedioTrimestreRepository.find({
      where: { materia_curso_id, trimestre_id },
      order: {
        estudiante: { nombres_completos: 'ASC' }
      }
    });
  }

  async findByCursoYTrimestre(curso_id: string, trimestre_id: string) {
    return await this.promedioTrimestreRepository
      .createQueryBuilder('pt')
      .innerJoinAndSelect('pt.estudiante', 'est')
      .innerJoinAndSelect('pt.materia_curso', 'mc')
      .innerJoinAndSelect('mc.materia', 'mat')
      .innerJoinAndSelect('pt.trimestre', 'trim')
      .where('mc.curso_id = :curso_id', { curso_id })
      .andWhere('pt.trimestre_id = :trimestre_id', { trimestre_id })
      .orderBy('est.nombres_completos', 'ASC')
      .addOrderBy('mat.nombre', 'ASC')
      .getMany();
  }

  async update(id: string, updatePromedioTrimestreDto: UpdatePromedioTrimestreDto) {
    const promedio = await this.findOne(id);

    if (updatePromedioTrimestreDto.observaciones !== undefined) {
      promedio.observaciones = updatePromedioTrimestreDto.observaciones;
    }

    return await this.promedioTrimestreRepository.save(promedio);
  }

  async remove(id: string) {
    const promedio = await this.findOne(id);
    await this.promedioTrimestreRepository.remove(promedio);
    return { message: 'Promedio trimestral eliminado exitosamente' };
  }

  async recalcular(id: string) {
    const promedioAnterior = await this.findOne(id);

    const { estudiante_id, materia_curso_id, trimestre_id, observaciones } = promedioAnterior;

    await this.promedioTrimestreRepository.remove(promedioAnterior);

    return await this.create({
      estudiante_id,
      materia_curso_id,
      trimestre_id,
      observaciones
    });
  }
}