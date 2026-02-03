
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    // Calculamos los valores RAW (con todos los decimales de JS)
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

    // ✅ LA CLAVE: Sumamos los valores exactos primero
    const sumaExacta = rawPonderadoInsumos + rawPonderadoProyecto + rawPonderadoExamen;

    // Ahora sí, redondeamos el final y los parciales para la DB
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

  async generarPromediosMasivo(trimestre_id: string): Promise<ResultadoGeneracionMasiva> {
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

    const materiasCurso = await this.materiaCursoRepository.find({
      where: {
        curso: { periodo_lectivo_id: trimestre.periodo_lectivo_id }
      },
      relations: ['curso', 'materia']
    });

    const materiasCuantitativas = materiasCurso.filter(
      mc => mc.materia.tipoCalificacion === TipoCalificacion.CUANTITATIVA
    );

    for (const materiaCurso of materiasCuantitativas) {
      const matriculas = await this.matriculaRepository.find({
        where: {
          curso_id: materiaCurso.curso_id,
          estado: EstadoMatricula.ACTIVO
        },
        relations: ['estudiante']
      });

      const matriculasActivas = matriculas.filter(m => m.estudiante.estado !== EstadoEstudiante.INACTIVO_TEMPORAL);

      for (const matricula of matriculasActivas) {
        resultado.total_procesados++;

        try {
          const existente = await this.promedioTrimestreRepository.findOne({
            where: {
              estudiante_id: matricula.estudiante_id,
              materia_curso_id: materiaCurso.id,
              trimestre_id
            }
          });

          if (existente) {
            continue;
          }

          await this.create({
            estudiante_id: matricula.estudiante_id,
            materia_curso_id: materiaCurso.id,
            trimestre_id
          });

          resultado.total_generados++;

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

    return resultado;
  }

  // 🔥 NUEVO: ROLLBACK DE PROMEDIOS TRIMESTRALES
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