import { PartialType } from '@nestjs/mapped-types';
import { CreatePeriodoLectivoDto } from './create-periodos-lectivo.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoPeriodo } from '../entities/periodos-lectivo.entity';

export class UpdatePeriodoLectivoDto extends PartialType(CreatePeriodoLectivoDto) {

    @IsOptional()
    @IsEnum(EstadoPeriodo)
    estado?: EstadoPeriodo;
}
