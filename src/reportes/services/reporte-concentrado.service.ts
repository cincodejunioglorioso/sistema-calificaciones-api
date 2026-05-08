import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PromedioTrimestre } from '../../promedio-trimestre/entities/promedio-trimestre.entity';
import { Matricula, EstadoMatricula } from '../../matriculas/entities/matricula.entity';
import { MateriaCurso } from '../../materia-curso/entities/materia-curso.entity';
import { DatosConcentradoCalificaciones, EstudianteConcentrado, CalificacionMateriaConcentrado, PromedioMateriaCurso, MateriaOrdenConcentrado } from '../interfaces/datos-concentrado.interface';
import { TrimestresService } from '../../trimestres/trimestres.service';
import { calcularConversionCualitativa } from '../../common/constants/escalas.constants';
import { NombreTrimestre } from '../../trimestres/entities/trimestre.entity';
import { EstadoMateria, TipoCalificacion } from '../../materias/entities/materia.entity';
import { CalificacionComponente, ConversionCualitativa } from '../../common/enums/cualitativa.enum';
import { CalificacionComponenteCualitativo } from '../../calificacion-cualitativa/entities/calificacion-cualitativa.entity';

@Injectable()
export class ReporteConcentradoService {
  constructor(
    @InjectRepository(PromedioTrimestre)
    private readonly promedioTrimestreRepository: Repository<PromedioTrimestre>,
    @InjectRepository(MateriaCurso)
    private readonly materiaCursoRepository: Repository<MateriaCurso>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    @InjectRepository(CalificacionComponenteCualitativo)
    private readonly calificacionComponenteCualitativoRepository: Repository<CalificacionComponenteCualitativo>,
    private readonly trimestresService: TrimestresService,
  ) { }

  async obtenerDatosConcentrado(
    curso_id: string,
    trimestre_id: string,
    docente_id?: string
  ): Promise<DatosConcentradoCalificaciones> {
    const trimestre = await this.trimestresService.findOne(trimestre_id);

    const materiasCurso = await this.materiaCursoRepository.find({
      where: {
        curso_id,
        periodo_lectivo_id: trimestre.periodo_lectivo_id
      },
      relations: ['materia', 'curso', 'curso.periodo_lectivo', 'curso.docente']
    });

    if (materiasCurso.length === 0) {
      throw new NotFoundException('No hay materias asignadas a este curso');
    }

    const materiasActivas = materiasCurso.filter(mc => mc.materia.estado === EstadoMateria.ACTIVO);
    if (materiasActivas.length === 0) {
      throw new NotFoundException('No hay materias activas asignadas a este curso');
    }

    const materiasCuantitativas = materiasActivas.filter(
      mc => mc.materia.tipoCalificacion === TipoCalificacion.CUANTITATIVA
    );
    const materiasCualitativas = materiasActivas.filter(
      mc => mc.materia.tipoCalificacion === TipoCalificacion.CUALITATIVA
    );

    const curso = materiasActivas[0].curso;

    if (docente_id && curso.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el tutor del curso puede generar este reporte');
    }

    const columnasCuantitativas = materiasCuantitativas
      .sort((a, b) => a.materia.nombre.localeCompare(b.materia.nombre))
      .map(mc => ({
        materia_nombre: mc.materia.nombre,
        tipo_calificacion: TipoCalificacion.CUANTITATIVA as TipoCalificacion,
        materia_id: mc.materia_id,
        materia_curso_id: mc.id
      }));

    const columnasCualitativas = materiasCualitativas
      .sort((a, b) => a.materia.nombre.localeCompare(b.materia.nombre))
      .map(mc => ({
        materia_nombre: mc.materia.nombre,
        tipo_calificacion: TipoCalificacion.CUALITATIVA as TipoCalificacion,
        materia_id: mc.materia_id,
        materia_curso_id: mc.id
      }));

    const columnasOrdenadas = [...columnasCuantitativas, ...columnasCualitativas];
    const materiasOrdenadas: MateriaOrdenConcentrado[] = columnasOrdenadas.map(c => ({
      materia_nombre: c.materia_nombre,
      tipo_calificacion: c.tipo_calificacion
    }));

    const matriculas = await this.matriculaRepository.find({
      where: {
        curso_id,
        estado: EstadoMatricula.ACTIVO
      },
      relations: ['estudiante'],
      order: { estudiante: { nombres_completos: 'ASC' } }
    });

    if (matriculas.length === 0) {
      throw new NotFoundException('No hay estudiantes matriculados en este curso');
    }

    const estudiantesIds = matriculas.map(m => m.estudiante_id);
    const materiasCuantitativasIds = materiasCuantitativas.map(mc => mc.id);
    const materiasCualitativasIds = materiasCualitativas.map(mc => mc.materia_id);

    // 🔥 Batch cuantitativas (filtrado por curso actual vía materia_curso_id)
    const promediosCuantitativos = materiasCuantitativasIds.length > 0
      ? await this.promedioTrimestreRepository.find({
        where: {
          estudiante_id: In(estudiantesIds),
          trimestre_id,
          materia_curso_id: In(materiasCuantitativasIds)
        },
        relations: ['materia_curso', 'materia_curso.materia']
      })
      : [];

    // 🔥 Batch cualitativas (filtrado por curso actual vía curso_id)
    const calificacionesCualitativas = materiasCualitativasIds.length > 0
      ? await this.calificacionComponenteCualitativoRepository.find({
        where: {
          estudiante_id: In(estudiantesIds),
          trimestre_id,
          curso_id,
          materia_id: In(materiasCualitativasIds)
        },
        relations: ['materia']
      })
      : [];

    const promedioMap = new Map<string, PromedioTrimestre>();
    promediosCuantitativos.forEach(p => {
      promedioMap.set(`${p.estudiante_id}:${p.materia_curso_id}`, p);
    });

    const cualitativaMap = new Map<string, CalificacionComponenteCualitativo>();
    calificacionesCualitativas.forEach(c => {
      cualitativaMap.set(`${c.estudiante_id}:${c.materia_id}`, c);
    });

    const estudiantesConCalificaciones: EstudianteConcentrado[] = matriculas.map((matricula) => {
      const calificacionesOrdenadas: CalificacionMateriaConcentrado[] = columnasOrdenadas.map(col => {
        if (col.tipo_calificacion === TipoCalificacion.CUANTITATIVA) {
          const p = promedioMap.get(`${matricula.estudiante_id}:${col.materia_curso_id}`);
          if (!p) {
            return {
              materia_nombre: col.materia_nombre,
              tipo_calificacion: TipoCalificacion.CUANTITATIVA,
              nota_final: null,
              conversion_cuantitativa: null,
              calificacion_cualitativa: null,
              valor_mostrar: '-'
            };
          }

          return {
            materia_nombre: col.materia_nombre,
            tipo_calificacion: TipoCalificacion.CUANTITATIVA,
            nota_final: Number(p.nota_final_trimestre),
            conversion_cuantitativa: p.cualitativa,
            calificacion_cualitativa: null,
            valor_mostrar: Number(p.nota_final_trimestre).toFixed(2)
          };
        }

        const c = cualitativaMap.get(`${matricula.estudiante_id}:${col.materia_id}`);
        return {
          materia_nombre: col.materia_nombre,
          tipo_calificacion: TipoCalificacion.CUALITATIVA,
          nota_final: null,
          conversion_cuantitativa: null,
          calificacion_cualitativa: c?.calificacion ?? null, // ✅ sin cast incorrecto
          valor_mostrar: c?.calificacion ?? '-'
        };
      });

      const notasValidas = calificacionesOrdenadas
        .filter(c => c.tipo_calificacion === TipoCalificacion.CUANTITATIVA && c.nota_final !== null)
        .map(c => c.nota_final as number);

      const promedio_general = notasValidas.length > 0
        ? notasValidas.reduce((sum, n) => sum + n, 0) / notasValidas.length
        : 0;

      const cualitativa_general = calcularConversionCualitativa(promedio_general);

      return {
        ranking: 0,
        nombres_completos: matricula.estudiante.nombres_completos,
        calificaciones_materias: calificacionesOrdenadas,
        promedio_general,
        cualitativa_general
      };
    });

    // Ranking NO cambia (solo cuantitativas)
    estudiantesConCalificaciones.sort((a, b) => b.promedio_general - a.promedio_general);
    estudiantesConCalificaciones.forEach((est, index) => {
      est.ranking = index + 1;
    });

    // Promedios/Modas por materia (misma tabla)
    const promediosPorMateria: PromedioMateriaCurso[] = columnasOrdenadas.map(col => {
      if (col.tipo_calificacion === TipoCalificacion.CUANTITATIVA) {
        const notas = estudiantesConCalificaciones
          .map(est => est.calificaciones_materias.find(c =>
            c.materia_nombre === col.materia_nombre &&
            c.tipo_calificacion === TipoCalificacion.CUANTITATIVA
          ))
          .filter(c => c?.nota_final !== null)
          .map(c => c!.nota_final as number);

        const promedio = notas.length > 0
          ? notas.reduce((sum, n) => sum + n, 0) / notas.length
          : 0;

        return {
          materia_nombre: col.materia_nombre,
          tipo_calificacion: TipoCalificacion.CUANTITATIVA,
          promedio_materia: promedio,
          moda_cualitativa: null,
          valor_mostrar: promedio > 0 ? promedio.toFixed(2) : '-'
        };
      }

      const cualitativas = estudiantesConCalificaciones
        .map(est => est.calificaciones_materias.find(c =>
          c.materia_nombre === col.materia_nombre &&
          c.tipo_calificacion === TipoCalificacion.CUALITATIVA
        )?.calificacion_cualitativa)
        .filter((v): v is CalificacionComponente => !!v);

      const moda = this.calcularModaComponenteCualitativo(cualitativas);

      return {
        materia_nombre: col.materia_nombre,
        tipo_calificacion: TipoCalificacion.CUALITATIVA,
        promedio_materia: null,
        moda_cualitativa: moda,
        valor_mostrar: moda ?? '-'
      };
    });

    const promediosCuantitativosCurso = promediosPorMateria.filter(
      p => p.tipo_calificacion === TipoCalificacion.CUANTITATIVA && (p.promedio_materia ?? 0) > 0
    );

    const promedio_general_curso = promediosCuantitativosCurso.length > 0
      ? promediosCuantitativosCurso.reduce((sum, p) => sum + (p.promedio_materia ?? 0), 0) / promediosCuantitativosCurso.length
      : 0;

    // ✅ Cualitativa general por MODA
    const cualitativasGenerales = estudiantesConCalificaciones.map(e => e.cualitativa_general);
    const cualitativaGeneralModa = this.calcularModaCualitativa(cualitativasGenerales);
    const cualitativa_general_curso = cualitativaGeneralModa ?? calcularConversionCualitativa(promedio_general_curso);

    return {
      curso: {
        nivel: curso.nivel,
        paralelo: curso.paralelo,
        especialidad: curso.especialidad,
      },
      trimestre: {
        nombre: trimestre.nombre,
        numero: this.getNumeroTrimestre(trimestre.nombre),
        fechaInicio: trimestre.fechaInicio,
        fechaFin: trimestre.fechaFin,
      },
      periodo: {
        nombre: curso.periodo_lectivo.nombre,
      },
      docente: curso.docente ? {
        nombres: curso.docente.nombres,
        apellidos: curso.docente.apellidos,
      } : {
        nombres: 'Sin',
        apellidos: 'Asignar'
      },
      materias_orden: materiasOrdenadas,
      estudiantes: estudiantesConCalificaciones,
      promedios_curso: promediosPorMateria,
      promedio_general_curso,
      cualitativa_general_curso,
    };
  }

  private calcularModaCualitativa(
    valores: ConversionCualitativa[]
  ): ConversionCualitativa | null {
    if (!valores.length) return null;

    const frecuencia = new Map<ConversionCualitativa, number>();
    valores.forEach(v => frecuencia.set(v, (frecuencia.get(v) ?? 0) + 1));

    // Desempate estable (mejor desempeño primero)
    const prioridad: ConversionCualitativa[] = ['DA', 'AA', 'PA', 'NA'] as ConversionCualitativa[];

    let moda: ConversionCualitativa | null = null;
    let max = -1;

    prioridad.forEach(valor => {
      const f = frecuencia.get(valor) ?? 0;
      if (f > max) {
        max = f;
        moda = valor;
      }
    });

    return moda;
  }

  private calcularModaComponenteCualitativo(
    valores: CalificacionComponente[]
  ): CalificacionComponente | null {
    if (!valores.length) return null;

    const frecuencia = new Map<CalificacionComponente, number>();
    valores.forEach(v => frecuencia.set(v, (frecuencia.get(v) ?? 0) + 1));

    let moda: CalificacionComponente | null = null;
    let max = -1;

    frecuencia.forEach((f, valor) => {
      if (f > max) {
        max = f;
        moda = valor;
      }
    });

    return moda;
  }

  private getNumeroTrimestre(nombre: NombreTrimestre): 1 | 2 | 3 {
    const map = {
      [NombreTrimestre.PRIMER_TRIMESTRE]: 1 as const,
      [NombreTrimestre.SEGUNDO_TRIMESTRE]: 2 as const,
      [NombreTrimestre.TERCER_TRIMESTRE]: 3 as const,
    };
    return map[nombre];
  }
}