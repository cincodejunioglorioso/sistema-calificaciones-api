import { IsEnum, IsOptional, IsNotEmpty, IsString, Matches, MaxLength, IsUUID } from "class-validator";
import { EspecialidadCurso, NivelCurso } from "../entities/curso.entity";

export class CreateCursoDto {

    @IsEnum(NivelCurso)
    @IsNotEmpty()
    nivel: NivelCurso;

    @IsString({ message: 'El paralelo es requerido' })
    @MaxLength(1, { message: 'El paralelo debe tener entre 1 caracter' })
    @Matches(/^[A-Z]$/, { message: 'El paralelo debe ser una letra (A-Z)' })
    paralelo: string;

    @IsEnum(EspecialidadCurso, {
        message: 'La especialidad debe ser: BASICA, TECNICO, CIENCIAS'
    })
    especialidad: EspecialidadCurso;

    @IsUUID()
    @IsNotEmpty()
    periodo_lectivo_id: string;

    @IsOptional()
    @IsUUID()
    docente_id?: string;
}
