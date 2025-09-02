import { PartialType } from '@nestjs/mapped-types';
import { CreatePeriodoLectivoDto } from './create-periodos-lectivo.dto';

export class UpdatePeriodoLectivoDto extends PartialType(CreatePeriodoLectivoDto) {}
