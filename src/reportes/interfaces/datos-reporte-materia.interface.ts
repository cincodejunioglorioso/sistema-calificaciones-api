import { CalificacionCualitativa } from '../../common/enums/cualitativa.enum';
import { EspecialidadCurso, NivelCurso } from '../../cursos/entities/curso.entity';
import { NombreTrimestre } from '../../trimestres/entities/trimestre.entity';

export interface CalificacionEstudianteMateria {
  estudiante_id: string;
  estudiante_nombre: string;
  estudiante_cedula: string;
  promedio_insumos: number | null;
  ponderado_insumos: number | null;
  nota_proyecto: number | null;
  ponderado_proyecto: number | null;
  nota_examen: number | null;
  ponderado_examen: number | null;
  nota_final: number;
  cualitativa: CalificacionCualitativa;
}

export interface EstadisticasMateria {
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
}

export interface DatosReporteMateria {
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
  
  porcentajes: {
    insumos: number;
    proyecto: number;
    examen: number;
  };
  
  calificaciones: CalificacionEstudianteMateria[];
  
  estadisticas: EstadisticasMateria;
}