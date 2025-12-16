import { PartialType } from '@nestjs/mapped-types';
import { CreateMateriaCursoDto } from './create-materia-curso.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoMateriaCurso } from '../entities/materia-curso.entity';

export class UpdateMateriaCursoDto extends PartialType(CreateMateriaCursoDto) {
    @IsEnum(EstadoMateriaCurso)
    @IsOptional()
    estado?: EstadoMateriaCurso;
}
