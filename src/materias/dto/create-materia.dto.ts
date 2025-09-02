import { IsString, IsEnum, IsOptional, Length, MaxLength } from 'class-validator';
import { NivelEducativo, TrimestreAplicable } from '../entities/materia.entity';

export class CreateMateriaDto {
  @IsString({ message: 'El nombre es requerido' })
  @Length(3, 50, { message: 'El nombre debe tener entre 3 y 50 caracteres' })
  nombre: string;

  @IsEnum(NivelEducativo, { 
    message: 'El nivel educativo debe ser INICIAL, BASICA o BACHILLERATO' 
  })
  nivelEducativo: NivelEducativo;

  @IsOptional()
  @IsEnum(TrimestreAplicable, { 
    message: 'El trimestre aplicable debe ser TODOS, PRIMER_TRIMESTRE, SEGUNDO_TRIMESTRE o TERCER_TRIMESTRE' 
  })
  trimestreAplicable?: TrimestreAplicable;
}