import { PartialType } from '@nestjs/mapped-types';
import { CreatePromedioPeriodoDto } from './create-promedio-periodo.dto';

export class UpdatePromedioPeriodoDto extends PartialType(CreatePromedioPeriodoDto) {}
