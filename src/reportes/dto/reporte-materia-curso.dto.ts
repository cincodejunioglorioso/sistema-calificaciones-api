import { IsUUID, IsEnum } from 'class-validator';


export class GenerarReporteMateriaDto {
  @IsUUID()
  materia_curso_id: string;
  
  @IsUUID()
  trimestre_id: string;
}