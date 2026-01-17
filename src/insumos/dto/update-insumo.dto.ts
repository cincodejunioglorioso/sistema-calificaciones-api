import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateInsumoDto } from './create-insumo.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoInsumo } from '../entities/insumo.entity';

export class UpdateInsumoDto extends PartialType(
    OmitType (CreateInsumoDto, ['materia_curso_id', 'trimestre_id'] as const)) {}
