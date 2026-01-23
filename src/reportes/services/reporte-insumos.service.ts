import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Insumo, EstadoInsumo } from '../../insumos/entities/insumo.entity';
import { CalificacionInsumo } from '../../calificacion_insumo/entities/calificacion_insumo.entity';
import { MateriaCurso } from '../../materia-curso/entities/materia-curso.entity';
import { Matricula, EstadoMatricula } from '../../matriculas/entities/matricula.entity';
import { DatosReporteInsumos, EstudianteReporteInsumos, CalificacionInsumoReporte } from '../interfaces/datos-reporte-insumos.interface';
import { TrimestresService } from '../../trimestres/trimestres.service';
import { calcularConversionCualitativa } from '../../common/constants/escalas.constants';
import { NombreTrimestre } from '../../trimestres/entities/trimestre.entity';

@Injectable()
export class ReporteInsumosService {
  constructor(
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
    @InjectRepository(CalificacionInsumo)
    private readonly calificacionInsumoRepository: Repository<CalificacionInsumo>,
    @InjectRepository(MateriaCurso)
    private readonly materiaCursoRepository: Repository<MateriaCurso>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    private readonly trimestresService: TrimestresService,
  ) {}

  async obtenerDatosReporteInsumos(
    materia_curso_id: string,
    trimestre_id: string
  ): Promise<DatosReporteInsumos> {
    
    // 1. Obtener materia-curso con relaciones
    const materiaCurso = await this.materiaCursoRepository.findOne({
      where: { id: materia_curso_id },
      relations: ['materia', 'curso', 'curso.periodo_lectivo', 'docente']
    });
    
    if (!materiaCurso) {
      throw new NotFoundException('Materia-curso no encontrada');
    }
    
    // 2. Obtener trimestre
    const trimestre = await this.trimestresService.findOne(trimestre_id);
    
    // 3. Verificar que el trimestre pertenece al período del curso
    if (trimestre.periodo_lectivo_id !== materiaCurso.curso.periodo_lectivo_id) {
      throw new NotFoundException('El trimestre no pertenece al período lectivo del curso');
    }
    
    // 4. Obtener todos los insumos PUBLICADOS de la materia-curso en el trimestre
    const insumos = await this.insumoRepository.find({
      where: {
        materia_curso_id,
        trimestre_id,
        estado: EstadoInsumo.CERRADO
      },
      order: { nombre: 'ASC' }
    });
    
    if (insumos.length === 0) {
      throw new NotFoundException('No hay insumos publicados para este trimestre');
    }
    
    const insumosOrden = insumos.map(i => i.nombre);
    const insumosIds = insumos.map(i => i.id);
    
    // 5. Obtener todos los estudiantes matriculados en el curso
    const matriculas = await this.matriculaRepository.find({
      where: { 
        curso_id: materiaCurso.curso_id,
        estado: EstadoMatricula.ACTIVO
      },
      relations: ['estudiante'],
      order: { estudiante: { nombres_completos: 'ASC' } }
    });
    
    if (matriculas.length === 0) {
      throw new NotFoundException('No hay estudiantes matriculados en este curso');
    }
    
    // 6. Obtener calificaciones de todos los estudiantes
    const estudiantesReporte: EstudianteReporteInsumos[] = await Promise.all(
      matriculas.map(async (matricula, index) => {
        const calificaciones = await this.calificacionInsumoRepository.find({
          where: {
            estudiante_id: matricula.estudiante_id,
            insumo: { id: In(insumosIds) }
          },
          relations: ['insumo']
        });
        
        // Crear mapa de calificaciones por insumo
        const calificacionesMap = new Map<string, number>();
        calificaciones.forEach(c => {
          const notaFinal = c.nota_final !== null ? Number(c.nota_final) : Number(c.nota_original);
          calificacionesMap.set(c.insumo.nombre, notaFinal);
        });
        
        // Crear array ordenado de calificaciones según el orden de insumos
        const calificacionesOrdenadas: CalificacionInsumoReporte[] = insumosOrden.map(insumoNombre => {
          return {
            insumo_nombre: insumoNombre,
            nota: calificacionesMap.get(insumoNombre) || null
          };
        });
        
        // Calcular promedio de insumos (solo notas válidas)
        const notasValidas = calificacionesOrdenadas
          .filter(c => c.nota !== null && c.nota > 0)
          .map(c => c.nota!);
        
        const promedio_insumos = notasValidas.length > 0
          ? notasValidas.reduce((sum, nota) => sum + nota, 0) / notasValidas.length
          : 0;
        
        const cualitativa = calcularConversionCualitativa(promedio_insumos);
        
        return {
          numero: index + 1,
          estudiante_nombre: matricula.estudiante.nombres_completos,
          calificaciones_insumos: calificacionesOrdenadas,
          promedio_insumos,
          cualitativa
        };
      })
    );
    
    // 7. Calcular promedios por insumo
    const promediosPorInsumo: number[] = insumosOrden.map((_, insumoIndex) => {
      const notasInsumo = estudiantesReporte
        .map(est => est.calificaciones_insumos[insumoIndex].nota)
        .filter(nota => nota !== null && nota > 0) as number[];
      
      return notasInsumo.length > 0
        ? notasInsumo.reduce((sum, nota) => sum + nota, 0) / notasInsumo.length
        : 0;
    });
    
    // 8. Calcular promedio general del curso
    const promediosValidos = estudiantesReporte
      .filter(est => est.promedio_insumos > 0)
      .map(est => est.promedio_insumos);
    
    const promedio_general_curso = promediosValidos.length > 0
      ? promediosValidos.reduce((sum, p) => sum + p, 0) / promediosValidos.length
      : 0;
    
    const cualitativa_general_curso = calcularConversionCualitativa(promedio_general_curso);
    
    // 9. Calcular estadísticas
    const notasFinales = estudiantesReporte.filter(e => e.promedio_insumos > 0);
    
    const estadisticas = {
      total_estudiantes: estudiantesReporte.length,
      aprobados: notasFinales.filter(e => e.promedio_insumos >= 7).length,
      reprobados: notasFinales.filter(e => e.promedio_insumos < 7).length,
      promedio_curso: promedio_general_curso,
      distribucion_cualitativa: {
        DA: notasFinales.filter(e => e.cualitativa === 'DA').length,
        AA: notasFinales.filter(e => e.cualitativa === 'AA').length,
        PA: notasFinales.filter(e => e.cualitativa === 'PA').length,
        NA: notasFinales.filter(e => e.cualitativa === 'NA').length,
      }
    };
    
    // 10. Construir respuesta
    return {
      materia: {
        id: materiaCurso.materia.id,
        nombre: materiaCurso.materia.nombre,
      },
      curso: {
        nivel: materiaCurso.curso.nivel,
        paralelo: materiaCurso.curso.paralelo,
        especialidad: materiaCurso.curso.especialidad,
      },
      trimestre: {
        nombre: trimestre.nombre,
        numero: this.getNumeroTrimestre(trimestre.nombre),
        fechaInicio: trimestre.fechaInicio,
        fechaFin: trimestre.fechaFin,
      },
      periodo: {
        nombre: materiaCurso.curso.periodo_lectivo.nombre,
      },
      docente: materiaCurso.docente ? {
        nombres: materiaCurso.docente.nombres,
        apellidos: materiaCurso.docente.apellidos,
      } : null,
      insumos_orden: insumosOrden,
      estudiantes: estudiantesReporte,
      promedios_por_insumo: promediosPorInsumo,
      promedio_general_curso,
      cualitativa_general_curso,
      estadisticas,
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