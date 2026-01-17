// nest-backend/src/reportes/services/reporte-materia.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromedioTrimestre } from '../../promedio-trimestre/entities/promedio-trimestre.entity';
import { MateriaCurso } from '../../materia-curso/entities/materia-curso.entity';
import { Matricula } from '../../matriculas/entities/matricula.entity';
import { CalificacionCualitativa } from '../../common/enums/cualitativa.enum';
import { calcularCalificacionCualitativa } from '../../common/constants/escalas.constants';
import { TrimestresService } from '../../trimestres/trimestres.service';
import { TiposEvaluacionService } from '../../tipos-evaluacion/tipos-evaluacion.service';
import { 
  DatosReporteMateria,
  CalificacionEstudianteMateria,
  EstadisticasMateria 
} from '../interfaces/datos-reporte-materia.interface';
import { NombreTrimestre } from '../../trimestres/entities/trimestre.entity';
import { EstadoMatricula } from '../../matriculas/entities/matricula.entity';

@Injectable()
export class ReporteMateriaService {
  constructor(
    @InjectRepository(PromedioTrimestre)
    private readonly promedioTrimestreRepository: Repository<PromedioTrimestre>,
    @InjectRepository(MateriaCurso)
    private readonly materiaCursoRepository: Repository<MateriaCurso>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    private readonly trimestresService: TrimestresService,
    private readonly tiposEvaluacionService: TiposEvaluacionService,
  ) {}

  /**
   * Obtiene todos los datos para generar el reporte de una materia
   */
  async obtenerDatosReporteMateria(
    materia_curso_id: string,
    trimestre_id: string
  ): Promise<DatosReporteMateria> {
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
      throw new NotFoundException(
        'El trimestre no pertenece al período lectivo del curso'
      );
    }
    
    // 4. Obtener porcentajes de evaluación
    const tiposEvaluacion = await this.tiposEvaluacionService.findByPeriodo(
      materiaCurso.curso.periodo_lectivo_id
    );
    
    const porcentajes = {
      insumos: Number(tiposEvaluacion.find(t => t.nombre === 'INSUMOS')?.porcentaje || 0),
      proyecto: Number(tiposEvaluacion.find(t => t.nombre === 'PROYECTO')?.porcentaje || 0),
      examen: Number(tiposEvaluacion.find(t => t.nombre === 'EXAMEN')?.porcentaje || 0),
    };
    
    // 5. Obtener todos los estudiantes matriculados en el curso
    const matriculas = await this.matriculaRepository.find({
      where: { 
        curso_id: materiaCurso.curso_id,
        estado: EstadoMatricula.ACTIVO
      },
      relations: ['estudiante'],
      order: { estudiante: { nombres_completos: 'ASC' } }
    });
    
    // 6. Obtener calificaciones de todos los estudiantes
    const calificaciones: CalificacionEstudianteMateria[] = await Promise.all(
      matriculas.map(async (matricula) => {
        const promedio = await this.promedioTrimestreRepository.findOne({
          where: {
            estudiante_id: matricula.estudiante_id,
            materia_curso_id: materia_curso_id,
            trimestre_id: trimestre_id
          }
        });
        
        return {
          estudiante_id: matricula.estudiante.id,
          estudiante_nombre: matricula.estudiante.nombres_completos,
          estudiante_cedula: matricula.estudiante.estudiante_cedula,
          promedio_insumos: promedio?.promedio_insumos ? Number(promedio.promedio_insumos) : null,
          ponderado_insumos: promedio?.ponderado_insumos ? Number(promedio.ponderado_insumos) : null,
          nota_proyecto: promedio?.nota_proyecto ? Number(promedio.nota_proyecto) : null,
          ponderado_proyecto: promedio?.ponderado_proyecto ? Number(promedio.ponderado_proyecto) : null,
          nota_examen: promedio?.nota_examen ? Number(promedio.nota_examen) : null,
          ponderado_examen: promedio?.ponderado_examen ? Number(promedio.ponderado_examen) : null,
          nota_final: promedio ? Number(promedio.nota_final_trimestre) : 0,
          cualitativa: promedio?.cualitativa || CalificacionCualitativa.NA,
        };
      })
    );
    
    // 7. Calcular estadísticas
    const estadisticas = this.calcularEstadisticas(calificaciones);
    
    // 8. Construir respuesta
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
      porcentajes,
      calificaciones,
      estadisticas,
    };
  }

  /**
   * Calcula estadísticas del curso
   */
  private calcularEstadisticas(
    calificaciones: CalificacionEstudianteMateria[]
  ): EstadisticasMateria {
    const notasValidas = calificaciones.filter(c => c.nota_final > 0);
    
    const total_estudiantes = calificaciones.length;
    const aprobados = notasValidas.filter(c => c.nota_final >= 7).length;
    const reprobados = notasValidas.filter(c => c.nota_final < 7).length;
    
    const promedio_curso = notasValidas.length > 0
      ? notasValidas.reduce((sum, c) => sum + c.nota_final, 0) / notasValidas.length
      : 0;
    
    const distribucion_cualitativa = {
      DA: calificaciones.filter(c => c.cualitativa === CalificacionCualitativa.DA).length,
      AA: calificaciones.filter(c => c.cualitativa === CalificacionCualitativa.AA).length,
      PA: calificaciones.filter(c => c.cualitativa === CalificacionCualitativa.PA).length,
      NA: calificaciones.filter(c => c.cualitativa === CalificacionCualitativa.NA).length,
    };
    
    return {
      total_estudiantes,
      aprobados,
      reprobados,
      promedio_curso: Math.round(promedio_curso * 100) / 100,
      distribucion_cualitativa,
    };
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