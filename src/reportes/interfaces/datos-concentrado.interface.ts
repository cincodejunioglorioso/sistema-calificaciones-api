// nest-backend/src/reportes/interfaces/datos-concentrado.interface.ts
import { ConversionCualitativa } from '../../common/enums/cualitativa.enum';
import { EspecialidadCurso, NivelCurso } from '../../cursos/entities/curso.entity';
import { NombreTrimestre } from '../../trimestres/entities/trimestre.entity';

export interface CalificacionMateriaConcentrado {
  materia_nombre: string;
  nota_final: number;
  cualitativa: ConversionCualitativa;
}

export interface EstudianteConcentrado {
  ranking: number;
  nombres_completos: string;
  calificaciones_materias: CalificacionMateriaConcentrado[];
  promedio_general: number;
  cualitativa_general: ConversionCualitativa;
}

// 🆕 Interface para promedios por materia del curso
export interface PromedioMateriaCurso {
  materia_nombre: string;
  promedio_materia: number;
}

export interface DatosConcentradoCalificaciones {
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
  };
  
  materias_orden: string[];
  estudiantes: EstudianteConcentrado[];
  
  // 🆕 Promedios del curso
  promedios_curso: PromedioMateriaCurso[];
  promedio_general_curso: number;
  cualitativa_general_curso: ConversionCualitativa;
}