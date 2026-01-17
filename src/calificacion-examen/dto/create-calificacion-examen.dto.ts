import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from "class-validator";

export class CalificacionExamenEstudianteDto {
    @IsNotEmpty()
    @IsUUID()
    estudiante_id: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(10)
    calificacion_examen: number;

    @IsOptional()
    @IsString()
    observaciones?: string;
}

export class CreateCalificacionExamenDto {
    @IsNotEmpty()
    @IsUUID()
    materia_curso_id: string;

    @IsNotEmpty()
    @IsUUID()
    trimestre_id: string;

    @IsOptional()
    @IsUUID()
    estudiante_id?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(10)
    calificacion_examen?: number;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CalificacionExamenEstudianteDto)
    calificaciones?: CalificacionExamenEstudianteDto[];
}