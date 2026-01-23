import { IsString, IsEnum, IsOptional, Length, MaxLength } from 'class-validator';
import { NivelEducativo, TipoCalificacion,  } from '../entities/materia.entity';

export class CreateMateriaDto {
  @IsString({ message: 'El nombre es requerido' })
  @Length(3, 50, { message: 'El nombre debe tener entre 3 y 50 caracteres' })
  nombre: string;

  @IsEnum(NivelEducativo, {
    message: 'El nivel educativo debe ser BASICA, BACHILLERATO o GENERAL'  })
  nivelEducativo: NivelEducativo;

  @IsOptional()
  @IsEnum(TipoCalificacion, { 
    message: 'El tipo de calificación debe ser CUALITATIVA o CUANTITATIVA' 
  })
  tipoCalificacion?: TipoCalificacion;
}