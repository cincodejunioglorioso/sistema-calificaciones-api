import { PartialType } from '@nestjs/mapped-types';
import { CreateTrimestreDto } from './create-trimestre.dto';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { NombreTrimestre, TrimestreEstado } from '../entities/trimestre.entity';

export class UpdateTrimestreDto extends PartialType(CreateTrimestreDto) {
  @IsOptional()
  @IsEnum(NombreTrimestre)
  nombre?: NombreTrimestre;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsEnum(TrimestreEstado)
  estado?: TrimestreEstado;
}
