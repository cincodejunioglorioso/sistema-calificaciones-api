// nest-backend/src/reportes/dto/reporte-estudiante.dto.ts
import { IsUUID, IsOptional, IsIn } from 'class-validator';

export class GenerarLibretaEstudianteDto {
  @IsUUID()
  estudiante_id: string;
  
  @IsUUID()
  trimestre_id: string;
}

export class GenerarLibretasCursoDto {
  @IsUUID()
  curso_id: string;
  
  @IsUUID()
  trimestre_id: string;
}