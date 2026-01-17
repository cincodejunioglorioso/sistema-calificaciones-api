import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from "class-validator";

export class CreateInsumoDto {
    
    @IsUUID()
    materia_curso_id: string;

    @IsUUID()
    trimestre_id: string;

    @IsOptional()
    @IsString()
    @Length(3, 50, { message: 'El nombre debe tener entre 3 y 50 caracteres' })
    nombre?: string;
}