import { PartialType } from '@nestjs/mapped-types';
import { CreateEstudianteDto } from './create-estudiante.dto';
import { IsEnum } from 'class-validator';
import { EstadoEstudiante } from '../entities/estudiante.entity';

export class UpdateEstudianteDto extends PartialType(CreateEstudianteDto) {

    @IsEnum(EstadoEstudiante)
    estado?: EstadoEstudiante;
}
