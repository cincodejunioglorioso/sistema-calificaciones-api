import { IsString, IsDateString, Length, IsOptional } from 'class-validator';

export class CreatePeriodoLectivoDto {
  @IsString({ message: 'El nombre es requerido' })
  @Length(5, 50, { message: 'El nombre debe tener entre 5 y 50 caracteres' })
  nombre: string;

  @IsDateString({}, { message: 'La fecha de inicio debe ser válida (YYYY-MM-DD)' })
  fechaInicio: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser válida (YYYY-MM-DD)' })
  fechaFin: string;
}