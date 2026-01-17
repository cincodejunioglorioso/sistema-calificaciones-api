import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateRecuperacionInsumoDto } from './create-recuperacion_insumo.dto';

export class UpdateRecuperacionInsumoDto extends PartialType(
    OmitType(CreateRecuperacionInsumoDto, ['calificacion_insumo_id'] as const)) {}
