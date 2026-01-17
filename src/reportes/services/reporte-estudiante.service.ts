import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromedioTrimestre } from '../../promedio-trimestre/entities/promedio-trimestre.entity';
import { PromedioPeriodo } from '../../promedio-periodo/entities/promedio-periodo.entity';
import { Trimestre } from '../../trimestres/entities/trimestre.entity';
import { Matricula } from '../../matriculas/entities/matricula.entity';
import { CalificacionCualitativa } from '../../common/enums/cualitativa.enum';
import { calcularCalificacionCualitativa } from '../../common/constants/escalas.constants';
import { EstudiantesService } from '../../estudiantes/estudiantes.service';
import { TrimestresService } from '../../trimestres/trimestres.service';
import { PromedioTrimestreService } from '../../promedio-trimestre/promedio-trimestre.service';
import { CursosService } from '../../cursos/cursos.service';
import {
  DatosLibretaEstudiante,
  CalificacionesTrimestreLibreta,
  CalificacionMateriaLibreta,
  PromedioAnualMateria
} from '../interfaces/datos-libreta.interface';
import { NombreTrimestre, TrimestreEstado } from '../../trimestres/entities/trimestre.entity';
import { EstadoMatricula } from '../../matriculas/entities/matricula.entity';

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

    // 3. Obtener matrícula activa del estudiante en este período (usando repository directo)
    const matricula = await this.matriculaRepository.findOne({
      where: {
        estudiante_id: estudiante_id,
        periodo_lectivo_id: trimestreActual.periodo_lectivo_id,
        estado: EstadoMatricula.ACTIVO
      },
      relations: ['estudiante', 'curso', 'periodo_lectivo']
    });

    if (!matricula) {
      throw new NotFoundException(
        `No se encontró matrícula activa para el estudiante en este período`
      );
    }

    // 4. Verificar permisos (si se proporcionó docente_id, debe ser tutor del curso)
    if (docente_id) {
      await this.verificarPermisoTutor(docente_id, matricula.curso_id);
    }

    // 5. Obtener todos los trimestres del período (ordenados)
    const todosLosTrimestres = await this.trimestresService.findTrimestresByPeriodo(
      trimestreActual.periodo_lectivo_id
    );

    // 6. Determinar qué trimestres mostrar (hasta el trimestre solicitado)
    const numeroTrimestreActual = this.getNumeroTrimestre(trimestreActual.nombre);
    const trimestresAMostrar = todosLosTrimestres
      .filter(t => this.getNumeroTrimestre(t.nombre) <= numeroTrimestreActual)
      .sort((a, b) => this.getNumeroTrimestre(a.nombre) - this.getNumeroTrimestre(b.nombre));

    // 7. Obtener calificaciones de cada trimestre
    const trimestresConCalificaciones: CalificacionesTrimestreLibreta[] = await Promise.all(
      trimestresAMostrar.map(async (trimestre) => {
        const calificacionesTrimestre = await this.promedioTrimestreRepository.find({
          where: {
            estudiante_id: estudiante_id,
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

        // Calcular promedio general del trimestre
        const promedio_general = materias.length > 0
          ? materias.reduce((sum, m) => sum + m.nota_final, 0) / materias.length
          : null;

        const cualitativa_general = promedio_general
          ? calcularCalificacionCualitativa(promedio_general)
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

    // 8. Obtener promedios anuales SOLO si los 3 trimestres están completos
    // Los promedios anuales se LEEN de la tabla promedio_periodo (no se calculan aquí)
    let promedios_anuales: PromedioAnualMateria[] | null = null;
    let promedio_general_anual: number | null = null;
    let cualitativa_general_anual: CalificacionCualitativa | null = null;

    if (trimestresConCalificaciones.length === 3) {
      // Buscar promedios anuales en la tabla promedio_periodo
      promedios_anuales = await this.obtenerPromediosAnuales(
        estudiante_id,
        trimestreActual.periodo_lectivo_id
      );

      if (promedios_anuales && promedios_anuales.length > 0) {
        promedio_general_anual = promedios_anuales.reduce((sum, m) => sum + m.promedio_anual, 0) / promedios_anuales.length;
        promedio_general_anual = Math.round(promedio_general_anual * 100) / 100;
        cualitativa_general_anual = calcularCalificacionCualitativa(promedio_general_anual);
      }
    }

    // 9. Construir respuesta
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
      promedio_general_anual,
      cualitativa_general_anual,
    };
  }

  /**
   * Obtiene los promedios anuales DESDE la tabla promedio_periodo
   * (NO los calcula, solo los lee si ya existen)
   */
  private async obtenerPromediosAnuales(
    estudiante_id: string,
    periodo_lectivo_id: string
  ): Promise<PromedioAnualMateria[] | null> {
    const promediosPeriodo = await this.promedioPeriodoRepository.find({
      where: {
        estudiante_id,
        periodo_lectivo_id
      },
      relations: ['materia_curso', 'materia_curso.materia']
    });

    if (!promediosPeriodo || promediosPeriodo.length === 0) {
      return null;
    }

    return promediosPeriodo.map(promedio => ({
      materia_nombre: promedio.materia_curso.materia.nombre,
      promedio_anual: Number(promedio.promedio_anual),
      cualitativa: promedio.cualitativa_anual,
    })).sort((a, b) => a.materia_nombre.localeCompare(b.materia_nombre));
  }

  /**
 * 🆕 NUEVO: Obtiene datos de libreta usando matricula_id específico
 * Permite generar reportes históricos sin filtrar por estado ACTIVO
 */
  async obtenerDatosLibretaPorMatricula(
    matricula_id: string
  ): Promise<DatosLibretaEstudiante> {
    // 1. Obtener matrícula con todas sus relaciones (SIN filtrar por estado)
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

    // Ordenar trimestres
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

        // Calcular promedio general del trimestre
        const promedio_general = materias.length > 0
          ? materias.reduce((sum, m) => sum + m.nota_final, 0) / materias.length
          : null;

        const cualitativa_general = promedio_general
          ? calcularCalificacionCualitativa(promedio_general)
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
    let cualitativa_general_anual: CalificacionCualitativa | null = null;

    if (trimestresConCalificaciones.length === 3) {
      promedios_anuales = await this.obtenerPromediosAnuales(
        matricula.estudiante_id,
        matricula.periodo_lectivo_id
      );

      if (promedios_anuales && promedios_anuales.length > 0) {
        promedio_general_anual = promedios_anuales.reduce((sum, m) => sum + m.promedio_anual, 0) / promedios_anuales.length;
        promedio_general_anual = Math.round(promedio_general_anual * 100) / 100;
        cualitativa_general_anual = calcularCalificacionCualitativa(promedio_general_anual);
      }
    }

    // 5. Construir respuesta
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
      promedio_general_anual,
      cualitativa_general_anual,
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