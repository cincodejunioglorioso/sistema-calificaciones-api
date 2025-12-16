import { PartialType } from '@nestjs/mapped-types';
import { CreateMatriculaDto } from './create-matricula.dto';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoMatricula } from '../entities/matricula.entity';


export class UpdateMatriculaDto extends PartialType(CreateMatriculaDto) {
    
    @IsOptional()
    @IsEnum(EstadoMatricula)
    estado?: EstadoMatricula;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de retiro debe ser válida (YYYY-MM-DD)' })
    fecha_retiro?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
}
