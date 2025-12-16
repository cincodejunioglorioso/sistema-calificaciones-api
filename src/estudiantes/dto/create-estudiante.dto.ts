import { IsBoolean, IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEstudianteDto {
    
    @IsNotEmpty({ message: 'La cédula es obligatoria' })
    @IsString()
    estudiante_cedula: string;

    @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
    @IsString()
    nombres_completos: string;

    @IsOptional()
    @IsEmail({}, { message: 'El email debe ser válido' })
    estudiante_email?: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de nacimiento debe ser válida (YYYY-MM-DD)' })
    fecha_de_nacimiento?: string;

    @IsOptional()
    @IsString()
    direccion?: string;

    // PADRE
    @IsOptional()
    @IsString()
    padre_nombre?: string;

    @IsOptional()
    @IsString()
    padre_apellido?: string;

    @IsOptional()
    @IsString()
    padre_cedula?: string;

    // MADRE
    @IsOptional()
    @IsString()
    madre_nombre?: string;

    @IsOptional()
    @IsString()
    madre_apellido?: string;

    @IsOptional()
    @IsString()
    madre_cedula?: string;

    @IsOptional()
    @IsBoolean()
    viven_juntos?: boolean;

    // REPRESENTANTE
    @IsOptional()
    @IsString()
    representante_nombre?: string;

    @IsOptional()
    @IsString()
    representante_apellido?: string;

    @IsOptional()
    @IsString()
    representante_telefono?: string;

    @IsOptional()
    @IsString()
    representante_telefono_auxiliar?: string;

    @IsOptional()
    @IsEmail()
    representante_correo?: string;

    @IsOptional()
    @IsString()
    representante_parentesco?: string;
}