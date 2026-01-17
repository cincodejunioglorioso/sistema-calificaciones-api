import { CalificacionCualitativa } from '../../common/enums/cualitativa.enum';
import { EspecialidadCurso, NivelCurso } from '../../cursos/entities/curso.entity';
import { NombreTrimestre, TrimestreEstado } from '../../trimestres/entities/trimestre.entity';

export interface CalificacionMateriaLibreta {
  materia_nombre: string;
  promedio_insumos: number | null;
  ponderado_insumos: number | null;
  nota_proyecto: number | null;
  ponderado_proyecto: number | null;
  nota_examen: number | null;
  ponderado_examen: number | null;
  nota_final: number;
  cualitativa: CalificacionCualitativa;
}

export interface CalificacionesTrimestreLibreta {
  trimestre_numero: 1 | 2 | 3;
  trimestre_nombre: NombreTrimestre;
  trimestre_estado: TrimestreEstado;
  materias: CalificacionMateriaLibreta[];
  promedio_general: number | null;
  cualitativa_general: CalificacionCualitativa | null;
}

export interface PromedioAnualMateria {
  materia_nombre: string;
  promedio_anual: number;
  cualitativa: CalificacionCualitativa;
}

export interface DatosLibretaEstudiante {
  estudiante: {
    id: string;
    nombres_completos: string;
    cedula: string;
  };
  
  curso: {
    nivel: NivelCurso;
    paralelo: string;
    especialidad: EspecialidadCurso;
  };
  
  periodo: {
    nombre: string;
    fechaInicio: Date;
    fechaFin: Date;
  };
  
  trimestres: CalificacionesTrimestreLibreta[];
  
  promedios_anuales: PromedioAnualMateria[] | null;
  
  promedio_general_anual: number | null;
  cualitativa_general_anual: CalificacionCualitativa | null;
}