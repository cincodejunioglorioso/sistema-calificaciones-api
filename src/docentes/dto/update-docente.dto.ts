import { IsOptional, IsString, IsEnum } from 'class-validator';
import { nivelAsignado } from '../entities/docente.entity';

export class UpdateDocenteDto {
  @IsOptional()
  @IsString()
  nombres?: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEnum(nivelAsignado)
  nivelAsignado?: nivelAsignado;
}