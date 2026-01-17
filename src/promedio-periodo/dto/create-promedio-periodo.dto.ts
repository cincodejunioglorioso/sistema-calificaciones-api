import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreatePromedioPeriodoDto {
    @IsNotEmpty()
    @IsUUID()
    estudiante_id: string;

    @IsNotEmpty()
    @IsUUID()
    materia_curso_id: string;

    @IsNotEmpty()
    @IsUUID()
    periodo_lectivo_id: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
}
