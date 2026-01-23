import { ConversionCualitativa } from '../../common/enums/cualitativa.enum';
import { EspecialidadCurso, NivelCurso } from '../../cursos/entities/curso.entity';
import { NombreTrimestre } from '../../trimestres/entities/trimestre.entity';

export interface CalificacionInsumoReporte {
  insumo_nombre: string;
  nota: number | null;
}

export interface EstudianteReporteInsumos {
  numero: number;
  estudiante_nombre: string;
  calificaciones_insumos: CalificacionInsumoReporte[];
  promedio_insumos: number;
  cualitativa: ConversionCualitativa;
}

export interface DatosReporteInsumos {
  materia: {
    id: string;
    nombre: string;
  };
  
  curso: {
    nivel: NivelCurso;
    paralelo: string;
    especialidad: EspecialidadCurso;
  };
  
  trimestre: {
    nombre: NombreTrimestre;
    numero: 1 | 2 | 3;
    fechaInicio: Date;
    fechaFin: Date;
  };
  
  periodo: {
    nombre: string;
  };
  
  docente: {
    nombres: string;
    apellidos: string;
  } | null;
  
  insumos_orden: string[]; // Lista ordenada de nombres de insumos
  estudiantes: EstudianteReporteInsumos[];
  
  // Promedios generales
  promedios_por_insumo: number[]; // Promedio de cada insumo
  promedio_general_curso: number;
  cualitativa_general_curso: ConversionCualitativa;
  
  // Estadísticas
  estadisticas: {
    total_estudiantes: number;
    aprobados: number;
    reprobados: number;
    promedio_curso: number;
    distribucion_cualitativa: {
      DA: number;
      AA: number;
      PA: number;
      NA: number;
    };
  };
}