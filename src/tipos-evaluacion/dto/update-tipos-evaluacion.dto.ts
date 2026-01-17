import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTipoEvaluacionDto } from './create-tipos-evaluacion.dto';

export class UpdateTipoEvaluacionDto extends PartialType(
  OmitType(CreateTipoEvaluacionDto, ['periodo_lectivo_id', 'nombre'] as const)
) {}