import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateCalificacionProyectoDto } from './create-calificacion-proyecto.dto';

export class UpdateCalificacionProyectoDto extends PartialType(
    OmitType(CreateCalificacionProyectoDto, [
        'estudiante_id', 
        'curso_id', 
        'trimestre_id'
    ] as const)
) {}
