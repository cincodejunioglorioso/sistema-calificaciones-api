export class RegistroImportacionDto {
  fila: number;
  sheet: string;
  año: string; // "OCTAVO", "PRIMERO", etc.
  paralelo: string; // "A", "B", "C", "D", "E"
  especialidad: string; // "BASICA", "CIENCIAS", "TECNICO"
  cedula: string;
  nombres_completos: string;
  correo: string;
  curso_parseado?: string; // "OCTAVO A - BASICA"
  curso_id?: string; // UUID del curso en BD
  valido: boolean;
  errores: string[];
}

export class ResumenImportacionDto {
  preview_id: string;
  total_registros: number;
  validos: number;
  invalidos: number;
  registros: RegistroImportacionDto[];
}

export class ResultadoImportacionDto {
  exitosas: number;
  fallidas: number;
  detalles: {
    cedula: string;
    nombre: string;
    curso: string;
    estado: 'EXITOSO' | 'FALLIDO';
    error?: string;
  }[];

  resumen: {
    registros_recibidos: number;
    registros_validos: number;
    registros_invalidos: number;
    registros_importados: number;
    registros_fallidos: number;
  };
}