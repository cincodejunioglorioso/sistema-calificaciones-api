import { Type } from "class-transformer";
import { IsUUID, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsString, IsArray, ArrayMinSize, ValidateNested } from "class-validator";



class CalificacionProyectoItem {
  @IsNotEmpty()
  @IsUUID()
  estudiante_id: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  calificacion_proyecto: number;

  @IsOptional()
  @IsString()
  observaciones?: string;  
}

export class CreateCalificacionProyectoDto {
  @IsNotEmpty()
  @IsUUID()
  curso_id: string;

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
  calificacion_proyecto?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CalificacionProyectoItem)
  calificaciones?: CalificacionProyectoItem[];
}