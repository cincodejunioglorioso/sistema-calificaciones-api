import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreatePromedioTrimestreDto {
    @IsNotEmpty()
    @IsUUID()
    estudiante_id: string;

    @IsNotEmpty()
    @IsUUID()
    materia_curso_id: string;

    @IsNotEmpty()
    @IsUUID()
    trimestre_id: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
}