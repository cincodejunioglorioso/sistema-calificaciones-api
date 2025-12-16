import { IsDateString, IsEnum, IsUUID } from "class-validator";
import { NombreTrimestre } from "../entities/trimestre.entity";

export class CreateTrimestreDto {

    @IsEnum(NombreTrimestre, {
        message: 'El nombre es requerido'
    })
    nombre: NombreTrimestre;

    @IsDateString({}, { message: 'La fecha de inicio debe ser válida (YYYY-MM-DD)' })
    fechaInicio: string;

    @IsDateString({}, { message: 'La fecha de fin debe ser válida (YYYY-MM-DD)' })
    fechaFin: string;

    @IsUUID()
    periodo_lectivo_id: string;

}

