import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from "class-validator";


export class CalificacionEstudianteDto {
    @IsNotEmpty()
    @IsUUID()
    estudiante_id: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(10)
    nota: number;

    @IsOptional()
    @IsString()
    observaciones?: string;
}

export class CreateCalificacionInsumoDto {
    
    @IsNotEmpty()
    @IsUUID()
    insumo_id: string;

    @IsOptional()
    @IsUUID()
    estudiante_id?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(10)
    nota?: number;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CalificacionEstudianteDto)
    calificaciones?: CalificacionEstudianteDto[];
}
