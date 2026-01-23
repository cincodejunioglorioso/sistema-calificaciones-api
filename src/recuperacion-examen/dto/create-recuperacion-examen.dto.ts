import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateRecuperacionExamenDto {
    @IsNotEmpty()
    @IsUUID()
    calificacion_examen_id: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(10)
    segundo_examen?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(10)
    trabajo_refuerzo?: number;

    @IsOptional()
    @IsString()
    observaciones?: string;
}