import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CalificacionComponente } from '../../common/enums/cualitativa.enum';

class CalificacionIndividual {
  @IsUUID()
  @IsNotEmpty()
  estudiante_id: string;

  @IsUUID()
  @IsNotEmpty()
  materia_id: string;

  @IsEnum(CalificacionComponente)
  @IsOptional()
  calificacion?: CalificacionComponente | null;
}

export class CalificarMasivoDto {
  @IsUUID()
  @IsNotEmpty()
  curso_id: string;

  @IsUUID()
  @IsNotEmpty()
  trimestre_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalificacionIndividual)
  calificaciones: CalificacionIndividual[];
}