import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { CalificacionComponente } from '../../common/enums/cualitativa.enum';

export class CreateCalificacionCualitativaDto {
  @IsUUID()
  @IsNotEmpty()
  estudiante_id: string;

  @IsUUID()
  @IsNotEmpty()
  curso_id: string;

  @IsUUID()
  @IsNotEmpty()
  materia_id: string;

  @IsUUID()
  @IsNotEmpty()
  trimestre_id: string;

  @IsEnum(CalificacionComponente)
  @IsOptional()
  calificacion?: CalificacionComponente | null;
}