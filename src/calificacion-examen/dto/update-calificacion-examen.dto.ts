import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateCalificacionExamenDto } from './create-calificacion-examen.dto';

export class UpdateCalificacionExamenDto extends PartialType(
    OmitType(CreateCalificacionExamenDto, ['estudiante_id', 'trimestre_id', 'materia_curso_id']) 
) {}
