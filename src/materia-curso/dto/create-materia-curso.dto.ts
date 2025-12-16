import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMateriaCursoDto {
    @IsNotEmpty()
    @IsUUID()
    curso_id: string;

    @IsNotEmpty()
    @IsUUID()
    materia_id: string;

    @IsNotEmpty()
    @IsUUID()
    periodo_lectivo_id: string;

    @IsUUID()
    @IsOptional()
    docente_id?: string;
}