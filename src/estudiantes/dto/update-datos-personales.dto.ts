import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsBoolean, IsEmail, IsDateString, IsEnum } from 'class-validator';
import { CreateEstudianteDto } from './create-estudiante.dto';
import { EstadoEstudiante } from '../entities/estudiante.entity';

export class UpdateDatosPersonalesDto extends PartialType (
    OmitType(CreateEstudianteDto, ['nombres_completos', 'estudiante_cedula', 'estudiante_email'] as const)) {

        @IsOptional()
        @IsEnum(EstadoEstudiante)
        estado?: EstadoEstudiante;
    }