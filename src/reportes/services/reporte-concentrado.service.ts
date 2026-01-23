import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromedioTrimestre } from '../../promedio-trimestre/entities/promedio-trimestre.entity';
import { Matricula, EstadoMatricula } from '../../matriculas/entities/matricula.entity';
import { MateriaCurso } from '../../materia-curso/entities/materia-curso.entity';
import { DatosConcentradoCalificaciones, EstudianteConcentrado, CalificacionMateriaConcentrado, PromedioMateriaCurso } from '../interfaces/datos-concentrado.interface';
import { TrimestresService } from '../../trimestres/trimestres.service';
import { calcularConversionCualitativa } from '../../common/constants/escalas.constants';
import { NombreTrimestre } from '../../trimestres/entities/trimestre.entity';
import { TipoCalificacion } from '../../materias/entities/materia.entity';

@Injectable()
export class ReporteConcentradoService {
  constructor(
    @InjectRepository(PromedioTrimestre)
    private readonly promedioTrimestreRepository: Repository<PromedioTrimestre>,
    @InjectRepository(MateriaCurso)
    private readonly materiaCursoRepository: Repository<MateriaCurso>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    private readonly trimestresService: TrimestresService,
  ) {}

  async obtenerDatosConcentrado(
    curso_id: string,
    trimestre_id: string,
    docente_id?: string
  ): Promise<DatosConcentradoCalificaciones> {
    
    // 1. Obtener trimestre
    const trimestre = await this.trimestresService.findOne(trimestre_id);

    // 2. Obtener todas las materias-curso del curso (SOLO CUANTITATIVAS)
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

    // 🆕 FILTRAR SOLO MATERIAS CUANTITATIVAS
    const materiasCuantitativas = materiasCurso.filter(
      mc => mc.materia.tipoCalificacion === TipoCalificacion.CUANTITATIVA
    );

    if (materiasCuantitativas.length === 0) {
      throw new NotFoundException('No hay materias cuantitativas asignadas a este curso');
    }

    // Tomar el primer materia-curso para obtener datos del curso
    const primerMateriaCurso = materiasCuantitativas[0];
    const curso = primerMateriaCurso.curso;

    // 3. Verificar permisos (solo tutor del curso puede generar)
    if (docente_id && curso.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el tutor del curso puede generar este reporte');
    }

    // 4. Obtener orden de materias CUANTITATIVAS
    const materiasOrdenadas = materiasCuantitativas
      .map(mc => mc.materia.nombre)
      .sort((a, b) => a.localeCompare(b));

    // Crear mapa de materia_curso_id por nombre
    const materiaCursoMap = new Map(
      materiasCuantitativas.map(mc => [mc.materia.nombre, mc.id])
    );

    // 5. Obtener estudiantes matriculados
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

    // 6. Obtener calificaciones de todos los estudiantes (SOLO MATERIAS CUANTITATIVAS)
    const estudiantesConCalificaciones: EstudianteConcentrado[] = await Promise.all(
      matriculas.map(async (matricula) => {
        const promedios = await this.promedioTrimestreRepository.find({
          where: {
            estudiante_id: matricula.estudiante_id,
            trimestre_id
          },
          relations: ['materia_curso', 'materia_curso.materia']
        });

        // 🆕 Filtrar solo promedios de materias cuantitativas
        const promediosCuantitativos = promedios.filter(
          p => p.materia_curso.materia.tipoCalificacion === TipoCalificacion.CUANTITATIVA
        );

        // Crear mapa de calificaciones por materia
        const calificacionesMap = new Map<string, CalificacionMateriaConcentrado>();
        
        promediosCuantitativos.forEach(p => {
          const materiaNombre = p.materia_curso.materia.nombre;
          calificacionesMap.set(materiaNombre, {
            materia_nombre: materiaNombre,
            nota_final: Number(p.nota_final_trimestre),
            cualitativa: p.cualitativa
          });
        });

        // Crear array ordenado de calificaciones según el orden de materias
        const calificacionesOrdenadas: CalificacionMateriaConcentrado[] = materiasOrdenadas.map(materiaNombre => {
          return calificacionesMap.get(materiaNombre) || {
            materia_nombre: materiaNombre,
            nota_final: 0,
            cualitativa: calcularConversionCualitativa(0)
          };
        });

        // Calcular promedio general (solo materias con nota > 0)
        const notasValidas = calificacionesOrdenadas.filter(c => c.nota_final > 0);
        const promedio_general = notasValidas.length > 0
          ? notasValidas.reduce((sum, c) => sum + c.nota_final, 0) / notasValidas.length
          : 0;

        const cualitativa_general = calcularConversionCualitativa(promedio_general);

        return {
          ranking: 0, // Se asignará después del ordenamiento
          nombres_completos: matricula.estudiante.nombres_completos,
          calificaciones_materias: calificacionesOrdenadas,
          promedio_general,
          cualitativa_general
        };
      })
    );

    // 7. Ordenar estudiantes por promedio (DESC) y asignar ranking
    estudiantesConCalificaciones.sort((a, b) => b.promedio_general - a.promedio_general);
    estudiantesConCalificaciones.forEach((est, index) => {
      est.ranking = index + 1;
    });

    // 🆕 8. Calcular promedios por materia del curso
    const promediosPorMateria: PromedioMateriaCurso[] = materiasOrdenadas.map(materiaNombre => {
      const notasMateria = estudiantesConCalificaciones
        .map(est => est.calificaciones_materias.find(c => c.materia_nombre === materiaNombre))
        .filter(cal => cal && cal.nota_final > 0)
        .map(cal => cal!.nota_final);

      const promedio = notasMateria.length > 0
        ? notasMateria.reduce((sum, nota) => sum + nota, 0) / notasMateria.length
        : 0;

      return {
        materia_nombre: materiaNombre,
        promedio_materia: promedio
      };
    });

    // 🆕 9. Calcular promedio general del curso
    const promediosValidos = promediosPorMateria.filter(p => p.promedio_materia > 0);
    const promedio_general_curso = promediosValidos.length > 0
      ? promediosValidos.reduce((sum, p) => sum + p.promedio_materia, 0) / promediosValidos.length
      : 0;

    const cualitativa_general_curso = calcularConversionCualitativa(promedio_general_curso);

    // 10. Construir respuesta
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

  private getNumeroTrimestre(nombre: NombreTrimestre): 1 | 2 | 3 {
    const map = {
      [NombreTrimestre.PRIMER_TRIMESTRE]: 1 as const,
      [NombreTrimestre.SEGUNDO_TRIMESTRE]: 2 as const,
      [NombreTrimestre.TERCER_TRIMESTRE]: 3 as const,
    };
    return map[nombre];
  }
}