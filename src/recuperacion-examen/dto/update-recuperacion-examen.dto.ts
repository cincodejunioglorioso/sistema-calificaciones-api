import { PartialType } from '@nestjs/mapped-types';
import { CreateRecuperacionExamenDto } from './create-recuperacion-examen.dto';

export class UpdateRecuperacionExamenDto extends PartialType(CreateRecuperacionExamenDto) {}
