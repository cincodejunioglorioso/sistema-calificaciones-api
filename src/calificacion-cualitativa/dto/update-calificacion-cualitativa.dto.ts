import { PartialType } from '@nestjs/mapped-types';
import { CreateCalificacionCualitativaDto } from './create-calificacion-cualitativa.dto';

export class UpdateCalificacionCualitativaDto extends PartialType(CreateCalificacionCualitativaDto) {}
