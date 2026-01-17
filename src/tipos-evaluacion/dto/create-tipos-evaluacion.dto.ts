import { IsEnum, IsInt, IsNumber, IsUUID, Max, Min } from "class-validator";
import { NombreTipoEvaluacion } from "../entities/tipos-evaluacion.entity";

export class CreateTipoEvaluacionDto {
    @IsUUID()
    periodo_lectivo_id: string;

    @IsEnum(NombreTipoEvaluacion)
    nombre: NombreTipoEvaluacion;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(100)
    porcentaje: number;
}