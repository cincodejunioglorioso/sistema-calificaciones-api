export interface EstudianteIncompleto {
  estudiante: string;
  estudiante_cedula: string;
  materia: string;
  curso: string;
  error: string;
}

export interface ResultadoGeneracionMasiva {
  total_procesados: number;
  total_generados: number;
  total_fallidos: number;
  estudiantes_incompletos: EstudianteIncompleto[];
}