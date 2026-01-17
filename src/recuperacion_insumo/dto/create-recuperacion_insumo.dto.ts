import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateRecuperacionInsumoDto {
    @IsUUID()
    calificacion_insumo_id: string;

    @IsNumber()
    @Min(0)
    @Max(10)
    nota_recuperacion: number;

    @IsOptional()
    @IsString()
    observaciones?: string;
}
