import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { OrigenMatricula } from "../entities/matricula.entity";

export class CreateMatriculaDto {
    @IsNotEmpty({ message: 'La cédula del estudiante es obligatoria' })
    @IsString()
    estudiante_cedula: string;

    @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
    @IsString()
    nombres_completos: string;

    @IsOptional()
    @IsEmail()
    estudiante_email?: string;

    @IsUUID()
    @IsNotEmpty()
    curso_id: string;

    @IsUUID()
    @IsNotEmpty()
    periodo_lectivo_id: string;

    @IsOptional()
    @IsEnum(OrigenMatricula)
    origen?: OrigenMatricula;

    @IsOptional()
    @IsString()
    observaciones?: string;
}
