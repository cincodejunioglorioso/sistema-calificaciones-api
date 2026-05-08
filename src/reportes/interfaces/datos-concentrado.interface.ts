import { CalificacionComponente, ConversionCualitativa } from '../../common/enums/cualitativa.enum';
import { EspecialidadCurso, NivelCurso } from '../../cursos/entities/curso.entity';
import { TipoCalificacion } from '../../materias/entities/materia.entity';
import { NombreTrimestre } from '../../trimestres/entities/trimestre.entity';

export interface CalificacionMateriaConcentrado {
  materia_nombre: string;
  tipo_calificacion: TipoCalificacion;
  nota_final: number | null;
  conversion_cuantitativa: ConversionCualitativa | null; // para materias cuantitativas
  calificacion_cualitativa: CalificacionComponente | null; // para materias cualitativas
  valor_mostrar: string;
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
  tipo_calificacion: TipoCalificacion;
  promedio_materia: number | null; // solo cuantitativas
  moda_cualitativa: CalificacionComponente | null; // solo cualitativas
  valor_mostrar: string;
}

export interface MateriaOrdenConcentrado {
  materia_nombre: string;
  tipo_calificacion: TipoCalificacion;
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
  
  materias_orden: MateriaOrdenConcentrado[];
  estudiantes: EstudianteConcentrado[];
  
  // 🆕 Promedios del curso
  promedios_curso: PromedioMateriaCurso[];
  promedio_general_curso: number;
  cualitativa_general_curso: ConversionCualitativa;
}