import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromedioTrimestre } from '../../promedio-trimestre/entities/promedio-trimestre.entity';
import { PromedioPeriodo } from '../../promedio-periodo/entities/promedio-periodo.entity';
import { Trimestre } from '../../trimestres/entities/trimestre.entity';
import { Matricula, EstadoMatricula } from '../../matriculas/entities/matricula.entity';
import { ConversionCualitativa, CalificacionComponente } from '../../common/enums/cualitativa.enum';
import { calcularConversionCualitativa } from '../../common/constants/escalas.constants';
import { EstudiantesService } from '../../estudiantes/estudiantes.service';
import { TrimestresService } from '../../trimestres/trimestres.service';
import { PromedioTrimestreService } from '../../promedio-trimestre/promedio-trimestre.service';
import { CursosService } from '../../cursos/cursos.service';
import { CalificacionCualitativaService } from '../../calificacion-cualitativa/calificacion-cualitativa.service'; // 🆕
import { NivelEducativo } from '../../materias/entities/materia.entity'; // 🆕
import {
  DatosLibretaEstudiante,
  CalificacionesTrimestreLibreta,
  CalificacionMateriaLibreta,
  PromedioAnualMateria,
  ComponentesCualitativosLibreta,
  ComponenteCualitativoLibreta,
  ComponenteCualitativoData,
} from '../interfaces/datos-libreta.interface';
import { NombreTrimestre } from '../../trimestres/entities/trimestre.entity';

@Injectable()
export class ReporteEstudianteService {
  constructor(
    @InjectRepository(PromedioTrimestre)
    private readonly promedioTrimestreRepository: Repository<PromedioTrimestre>,
    @InjectRepository(PromedioPeriodo)
    private readonly promedioPeriodoRepository: Repository<PromedioPeriodo>,
    @InjectRepository(Trimestre)
    private readonly trimestreRepository: Repository<Trimestre>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    private readonly estudiantesService: EstudiantesService,
    private readonly trimestresService: TrimestresService,
    private readonly promedioTrimestreService: PromedioTrimestreService,
    private readonly cursosService: CursosService,
    private readonly calificacionCualitativaService: CalificacionCualitativaService, // 🆕
  ) { }

  /**
   * Obtiene todos los datos necesarios para generar la libreta de un estudiante
   */
  async obtenerDatosLibreta(
    estudiante_id: string,
    trimestre_id: string,
    usuario_id?: string,
    docente_id?: string
  ): Promise<DatosLibretaEstudiante> {
    // 1. Obtener estudiante
    const estudiante = await this.estudiantesService.findOne(estudiante_id);

    // 2. Obtener trimestre solicitado
    const trimestreActual = await this.trimestresService.findOne(trimestre_id);

    // 3. Obtener matrícula activa
    const matricula = await this.matriculaRepository.findOne({
      where: {
        estudiante_id: estudiante_id,
        periodo_lectivo_id: trimestreActual.periodo_lectivo_id,
        estado: EstadoMatricula.ACTIVO
      },
      relations: ['estudiante', 'curso', 'periodo_lectivo']
    });

    if (!matricula) {
      throw new NotFoundException(`No se encontró matrícula activa`);
    }

    // 4. Verificar permisos
    if (docente_id) {
      await this.verificarPermisoTutor(docente_id, matricula.curso_id);
    }

    // 5 y 6. Trimestres a mostrar
    const todosLosTrimestres = await this.trimestresService.findTrimestresByPeriodo(
      trimestreActual.periodo_lectivo_id
    );
    const numeroTrimestreActual = this.getNumeroTrimestre(trimestreActual.nombre);
    const trimestresAMostrar = todosLosTrimestres
      .filter(t => this.getNumeroTrimestre(t.nombre) <= numeroTrimestreActual)
      .sort((a, b) => this.getNumeroTrimestre(a.nombre) - this.getNumeroTrimestre(b.nombre));

    // 7. Calificaciones por trimestre
    const trimestresConCalificaciones: CalificacionesTrimestreLibreta[] = await Promise.all(
      trimestresAMostrar.map(async (trimestre) => {
        const calificacionesTrimestre = await this.promedioTrimestreRepository.find({
          where: { estudiante_id, trimestre_id: trimestre.id },
          relations: ['materia_curso', 'materia_curso.materia']
        });

        const materias: CalificacionMateriaLibreta[] = calificacionesTrimestre.map(cal => ({
          materia_nombre: cal.materia_curso.materia.nombre,
          promedio_insumos: cal.promedio_insumos ? Number(cal.promedio_insumos) : null,
          ponderado_insumos: cal.ponderado_insumos ? Number(cal.ponderado_insumos) : null,
          nota_proyecto: cal.nota_proyecto ? Number(cal.nota_proyecto) : null,
          ponderado_proyecto: cal.ponderado_proyecto ? Number(cal.ponderado_proyecto) : null,
          nota_examen: cal.nota_examen ? Number(cal.nota_examen) : null,
          ponderado_examen: cal.ponderado_examen ? Number(cal.ponderado_examen) : null,
          nota_final: Number(cal.nota_final_trimestre),
          cualitativa: cal.cualitativa,
        }));

        const promedio_general = materias.length > 0
          ? materias.reduce((sum, m) => sum + m.nota_final, 0) / materias.length
          : null;

        return {
          trimestre_numero: this.getNumeroTrimestre(trimestre.nombre),
          trimestre_nombre: trimestre.nombre,
          trimestre_estado: trimestre.estado,
          materias,
          promedio_general: promedio_general ? Math.round(promedio_general * 100) / 100 : null,
          cualitativa_general: promedio_general ? calcularConversionCualitativa(promedio_general) : null,
        };
      })
    );

    // 8. Inicializar variables de fin de año
    let promedios_anuales: PromedioAnualMateria[] | null = null;
    let promedio_general_trimestres: number | null = null; // Para la columna "3 Trimestres"
    let promedio_general_anual: number | null = null;     // Para la columna "Final Anual"
    let cualitativa_general_anual: ConversionCualitativa | null = null;

    // 9. Componentes cualitativos
    const componentes_cualitativos = await this.obtenerComponentesCualitativos(
      estudiante_id,
      matricula.curso_id,
      trimestreActual.periodo_lectivo_id,
      matricula.curso.nivel
    );

    // 10. Lógica de promedios anuales (Solo si están los 3 trimestres)
    if (trimestresConCalificaciones.length === 3) {
      promedios_anuales = await this.obtenerPromediosAnuales(
        estudiante_id,
        trimestreActual.periodo_lectivo_id
      );

      if (promedios_anuales && promedios_anuales.length > 0) {
        // --- CÁLCULO 1: Promedio de los 3 trimestres (SIN supletorio) ---
        const sumaTrimestres = promedios_anuales.reduce((sum, m) => sum + m.promedio_anual, 0);
        promedio_general_trimestres = Math.round((sumaTrimestres / promedios_anuales.length) * 100) / 100;

        // --- CÁLCULO 2: Promedio Final Anual (CON supletorio aplicado) ---
        const sumaFinalDefinitiva = promedios_anuales.reduce((sum, m) => {
          const notaDefinitiva = m.promedio_final !== null ? m.promedio_final : m.promedio_anual;
          return sum + notaDefinitiva;
        }, 0);

        promedio_general_anual = Math.round((sumaFinalDefinitiva / promedios_anuales.length) * 100) / 100;
        cualitativa_general_anual = calcularConversionCualitativa(promedio_general_anual);
      }
    }

    // 11. Retorno con todos los campos requeridos por la Interface
    return {
      estudiante: {
        id: estudiante.id,
        nombres_completos: estudiante.nombres_completos,
        cedula: estudiante.estudiante_cedula,
      },
      curso: {
        nivel: matricula.curso.nivel,
        paralelo: matricula.curso.paralelo,
        especialidad: matricula.curso.especialidad,
      },
      periodo: {
        nombre: matricula.periodo_lectivo.nombre,
        fechaInicio: matricula.periodo_lectivo.fechaInicio,
        fechaFin: matricula.periodo_lectivo.fechaFin,
      },
      trimestres: trimestresConCalificaciones,
      promedios_anuales,
      promedio_general_trimestres, // <--- Esto soluciona el error TS
      promedio_general_anual,
      cualitativa_general_anual,
      componentes_cualitativos,
    };
  }

  /**
   * 🆕 OBTENER COMPONENTES CUALITATIVOS REALES (DINÁMICO)
   */
  private async obtenerComponentesCualitativos(
    estudiante_id: string,
    curso_id: string,
    periodo_lectivo_id: string,
    nivelCurso: string
  ): Promise<ComponentesCualitativosLibreta> {
    // Determinar nivel educativo
    const nivelesBasicos = ['OCTAVO', 'NOVENO', 'DECIMO', 'BÁSICA', 'BASICA'];
    const nivelEducativo = nivelesBasicos.some(n => nivelCurso.toUpperCase().includes(n))
      ? NivelEducativo.BASICA
      : NivelEducativo.BACHILLERATO;

    // Obtener componentes según nivel (incluye GENERAL automáticamente)
    const componentesDisponibles = await this.calificacionCualitativaService.obtenerComponentesPorNivel(nivelEducativo);

    // Obtener todas las calificaciones del estudiante en este período
    const calificaciones = await this.calificacionCualitativaService.findByEstudiantePeriodo(
      estudiante_id,
      periodo_lectivo_id
    );

    // Construir array de componentes dinámico
    const componentes: ComponenteCualitativoData[] = [];

    for (const componente of componentesDisponibles) {
      const calificacionesPorTrimestre = calificaciones.filter(
        cal => cal.materia_id === componente.id
      );

      // Ordenar por trimestre
      const trim1 = calificacionesPorTrimestre.find(c => this.getNumeroTrimestre(c.trimestre.nombre) === 1);
      const trim2 = calificacionesPorTrimestre.find(c => this.getNumeroTrimestre(c.trimestre.nombre) === 2);
      const trim3 = calificacionesPorTrimestre.find(c => this.getNumeroTrimestre(c.trimestre.nombre) === 3);

      // Calcular promedio anual (MODA) solo si hay 3 trimestres
      let promedio_anual: CalificacionComponente | null = null;
      if (trim1 && trim2 && trim3) {
        promedio_anual = await this.calificacionCualitativaService.calcularPromedioAnual(
          estudiante_id,
          componente.id,
          periodo_lectivo_id
        );
      }

      // ✅ Determinar si es "Comportamiento" para separar en el PDF
      const nombreLower = componente.nombre.toLowerCase();
      const esComportamiento = nombreLower.includes('comportamiento');

      componentes.push({
        materia_id: componente.id,
        materia_nombre: componente.nombre,
        es_comportamiento: esComportamiento,
        calificaciones: {
          trimestre_1: trim1?.calificacion ?? null,
          trimestre_2: trim2?.calificacion ?? null,
          trimestre_3: trim3?.calificacion ?? null,
          promedio_anual,
        },
      });
    }

    // ✅ Ordenar: Comportamiento primero, luego alfabéticamente
    componentes.sort((a, b) => {
      if (a.es_comportamiento && !b.es_comportamiento) return -1;
      if (!a.es_comportamiento && b.es_comportamiento) return 1;
      return a.materia_nombre.localeCompare(b.materia_nombre);
    });

    return { componentes };
  }

  /**
   * Obtiene los promedios anuales DESDE la tabla promedio_periodo
   */
  private async obtenerPromediosAnuales(
    estudiante_id: string,
    periodo_lectivo_id: string
  ): Promise<PromedioAnualMateria[] | null> {
    const promedios = await this.promedioPeriodoRepository.find({
      where: { estudiante_id, periodo_lectivo_id },
      relations: ['materia_curso', 'materia_curso.materia'],
      order: {
        materia_curso: { materia: { nombre: 'ASC' } }
      }
    });

    if (promedios.length === 0) {
      return null;
    }

    return promedios.map(p => {
      let valorFinalCalculado = p.promedio_final ? Number(p.promedio_final) : null;

      if (p.nota_supletorio !== null && valorFinalCalculado !== null) {
        if (valorFinalCalculado >= 7.0) {
          valorFinalCalculado = 7.0;
        }
      }

      return {
        materia_nombre: p.materia_curso.materia.nombre,
        promedio_anual: Number(p.promedio_anual),
        cualitativa: p.cualitativa_anual,
        // 🆕 CAMPOS DE SUPLETORIO
        nota_supletorio: p.nota_supletorio ? Number(p.nota_supletorio) : null,
        promedio_final: valorFinalCalculado,
        cualitativa_final: p.cualitativa_final || null,
      };
    });
  }

  /**
   * 🆕 NUEVO: Obtiene datos de libreta usando matricula_id específico
   */
  async obtenerDatosLibretaPorMatricula(
    matricula_id: string
  ): Promise<DatosLibretaEstudiante> {
    // 1. Obtener matrícula con todas sus relaciones
    const matricula = await this.matriculaRepository.findOne({
      where: { id: matricula_id },
      relations: ['estudiante', 'curso', 'periodo_lectivo']
    });

    if (!matricula) {
      throw new NotFoundException(`Matrícula con ID ${matricula_id} no encontrada`);
    }

    // 2. Obtener todos los trimestres del período
    const todosLosTrimestres = await this.trimestresService.findTrimestresByPeriodo(
      matricula.periodo_lectivo_id
    );

    const trimestresOrdenados = todosLosTrimestres.sort(
      (a, b) => this.getNumeroTrimestre(a.nombre) - this.getNumeroTrimestre(b.nombre)
    );

    // 3. Obtener calificaciones de cada trimestre
    const trimestresConCalificaciones: CalificacionesTrimestreLibreta[] = await Promise.all(
      trimestresOrdenados.map(async (trimestre) => {
        const calificacionesTrimestre = await this.promedioTrimestreRepository.find({
          where: {
            estudiante_id: matricula.estudiante_id,
            trimestre_id: trimestre.id
          },
          relations: ['materia_curso', 'materia_curso.materia']
        });

        const materias: CalificacionMateriaLibreta[] = calificacionesTrimestre.map(cal => ({
          materia_nombre: cal.materia_curso.materia.nombre,
          promedio_insumos: cal.promedio_insumos ? Number(cal.promedio_insumos) : null,
          ponderado_insumos: cal.ponderado_insumos ? Number(cal.ponderado_insumos) : null,
          nota_proyecto: cal.nota_proyecto ? Number(cal.nota_proyecto) : null,
          ponderado_proyecto: cal.ponderado_proyecto ? Number(cal.ponderado_proyecto) : null,
          nota_examen: cal.nota_examen ? Number(cal.nota_examen) : null,
          ponderado_examen: cal.ponderado_examen ? Number(cal.ponderado_examen) : null,
          nota_final: Number(cal.nota_final_trimestre),
          cualitativa: cal.cualitativa,
        }));

        const promedio_general = materias.length > 0
          ? materias.reduce((sum, m) => sum + m.nota_final, 0) / materias.length
          : null;

        const cualitativa_general = promedio_general
          ? calcularConversionCualitativa(promedio_general)
          : null;

        return {
          trimestre_numero: this.getNumeroTrimestre(trimestre.nombre),
          trimestre_nombre: trimestre.nombre,
          trimestre_estado: trimestre.estado,
          materias,
          promedio_general: promedio_general ? Math.round(promedio_general * 100) / 100 : null,
          cualitativa_general,
        };
      })
    );

    // 4. Obtener promedios anuales si existen
    let promedios_anuales: PromedioAnualMateria[] | null = null;
    let promedio_general_anual: number | null = null;
    let cualitativa_general_anual: ConversionCualitativa | null = null;
    let promedio_general_trimestres: number | null = null;

    if (trimestresConCalificaciones.length === 3) {
      promedios_anuales = await this.obtenerPromediosAnuales(
        matricula.estudiante_id,
        matricula.periodo_lectivo_id
      );

      if (promedios_anuales && promedios_anuales.length > 0) {
        // 1. Cálculo del Promedio de los 3 Trimestres (Columna: PROMEDIO FINAL 3 TRIM)
        const sumaTrimestres = promedios_anuales.reduce((sum, m) => sum + m.promedio_anual, 0);
        promedio_general_trimestres = Math.round((sumaTrimestres / promedios_anuales.length) * 100) / 100;

        // 2. Cálculo del Promedio Final Anual (Columna: PROMEDIO FINAL ANUAL)
        const sumaParaPromedioGlobal = promedios_anuales.reduce((sum, m) => {
          // Usamos promedio_final (post-supletorio) si existe, sino el anual normal
          const notaMateria = m.promedio_final !== null ? m.promedio_final : m.promedio_anual;
          return sum + notaMateria;
        }, 0);

        const resultadoFinal = sumaParaPromedioGlobal / promedios_anuales.length;
        promedio_general_anual = Math.round(resultadoFinal * 100) / 100;
        cualitativa_general_anual = calcularConversionCualitativa(promedio_general_anual);
      }
    }


    // 🆕 5. Obtener componentes cualitativos
    const componentes_cualitativos = await this.obtenerComponentesCualitativos(
      matricula.estudiante_id,
      matricula.curso_id,
      matricula.periodo_lectivo_id,
      matricula.curso.nivel
    );

    // 6. Construir respuesta
    return {
      estudiante: {
        id: matricula.estudiante.id,
        nombres_completos: matricula.estudiante.nombres_completos,
        cedula: matricula.estudiante.estudiante_cedula,
      },
      curso: {
        nivel: matricula.curso.nivel,
        paralelo: matricula.curso.paralelo,
        especialidad: matricula.curso.especialidad,
      },
      periodo: {
        nombre: matricula.periodo_lectivo.nombre,
        fechaInicio: matricula.periodo_lectivo.fechaInicio,
        fechaFin: matricula.periodo_lectivo.fechaFin,
      },
      trimestres: trimestresConCalificaciones,
      promedios_anuales,
      promedio_general_trimestres,
      promedio_general_anual,
      cualitativa_general_anual,
      componentes_cualitativos, // 🆕
    };
  }

  /**
   * Verifica que el docente es tutor del curso
   */
  private async verificarPermisoTutor(
    docente_id: string,
    curso_id: string
  ): Promise<void> {
    const curso = await this.cursosService.findOne(curso_id);

    if (curso.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el tutor del curso puede generar libretas');
    }
  }

  /**
   * Convierte nombre de trimestre a número
   */
  private getNumeroTrimestre(nombre: NombreTrimestre): 1 | 2 | 3 {
    switch (nombre) {
      case NombreTrimestre.PRIMER_TRIMESTRE:
        return 1;
      case NombreTrimestre.SEGUNDO_TRIMESTRE:
        return 2;
      case NombreTrimestre.TERCER_TRIMESTRE:
        return 3;
    }
  }
}