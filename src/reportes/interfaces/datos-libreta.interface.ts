// nest-backend/src/reportes/interfaces/datos-libreta.interface.ts
import { ConversionCualitativa, CalificacionComponente } from '../../common/enums/cualitativa.enum'; // 🔄 CAMBIO
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
  cualitativa: ConversionCualitativa; // ✅ Para DA, AA, PA, NA
}

export interface CalificacionesTrimestreLibreta {
  trimestre_numero: 1 | 2 | 3;
  trimestre_nombre: NombreTrimestre;
  trimestre_estado: TrimestreEstado;
  materias: CalificacionMateriaLibreta[];
  promedio_general: number | null;
  cualitativa_general: ConversionCualitativa | null; // ✅ Para DA, AA, PA, NA
}

export interface PromedioAnualMateria {
  materia_nombre: string;
  promedio_anual: number;
  cualitativa: ConversionCualitativa; // ✅ Para DA, AA, PA, NA
  nota_supletorio: number | null;
  promedio_final: number | null;
  cualitativa_final: ConversionCualitativa | null; // ✅ Para DA, AA, PA, NA
}

export interface ComponenteCualitativoLibreta {
  trimestre_1: CalificacionComponente | null; // ✅ Para +A, A, B+, etc.
  trimestre_2: CalificacionComponente | null;
  trimestre_3: CalificacionComponente | null;
  promedio_anual: CalificacionComponente | null;
}

export interface ComponentesCualitativosLibreta {
  componentes: ComponenteCualitativoData[];
}

export interface ComponenteCualitativoData {
  materia_id: string;
  materia_nombre: string;
  es_comportamiento: boolean;
  calificaciones: ComponenteCualitativoLibreta;
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
  cualitativa_general_anual: ConversionCualitativa | null; // ✅ Para DA, AA, PA, NA
  componentes_cualitativos: ComponentesCualitativosLibreta;
}

export interface ComponenteCualitativoTrimestre {
  materia_nombre: string;
  calificacion: CalificacionComponente | null; // ✅ Para +A, A, B+, etc.
}