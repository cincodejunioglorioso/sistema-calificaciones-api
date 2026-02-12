import { ConversionCualitativa } from '../../common/enums/cualitativa.enum';
import { EspecialidadCurso, NivelCurso } from '../../cursos/entities/curso.entity';

export interface CalificacionEstudianteRendimiento {
  numero: number;
  estudiante_nombre: string;
  trimestre_1: number;
  cualitativa_1: ConversionCualitativa;
  trimestre_2: number;
  cualitativa_2: ConversionCualitativa;
  trimestre_3: number;
  cualitativa_3: ConversionCualitativa;
  promedio_anual: number;
  cualitativa_anual: ConversionCualitativa;
  estado_antes_supletorio: 'APROBADO' | 'SUPLETORIO' | 'REPROBADO';
  promedio_final: number | null;
  cualitativa_final: ConversionCualitativa | null;
  estado_final: string;
}

// --- CAMBIO AQUÍ: Estructuras para las tablas del pie de página ---

export interface EstadisticasRendimientoAnual {
  da: number;
  aa: number;
  pa: number;
  na: number;
}

export interface ResumenAprobadosSupletorios {
  trimestral_aprobados: number;
  trimestral_supletorios: number;
  trimestral_reprobados: number;
  supletorio_aprobados: number;
  supletorio_reprobados: number;
}

export interface DatosRendimientoAnual {
  materia: { id: string; nombre: string; };
  curso: { nivel: NivelCurso; paralelo: string; especialidad: EspecialidadCurso; };
  periodo: { nombre: string; };
  docente: { nombres: string; apellidos: string; } | null;
  
  estudiantes: CalificacionEstudianteRendimiento[];
  
  // Agregamos los promedios de la fila verde
  promedios_globales: {
    trimestre_1: number;
    trimestre_2: number;
    trimestre_3: number;
    promedio_anual: number;
  };

  // Las nuevas estadísticas para los cuadros de abajo
  estadisticas_rendimiento: EstadisticasRendimientoAnual;
  resumen_anual: ResumenAprobadosSupletorios;
  resumen_final: {
    aprobados: number;
    porcentaje_aprobados: number;
    reprobados: number;
    porcentaje_reprobados: number;
    total_asistentes: number;
  };
}