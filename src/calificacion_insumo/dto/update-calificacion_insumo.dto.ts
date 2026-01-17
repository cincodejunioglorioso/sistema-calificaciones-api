import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateCalificacionInsumoDto } from './create-calificacion_insumo.dto';

export class UpdateCalificacionInsumoDto extends PartialType(
    OmitType(CreateCalificacionInsumoDto, ['insumo_id', 'estudiante_id', 'calificaciones'] as const)) {}
