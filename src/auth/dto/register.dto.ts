import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional, MaxLength, Length } from "class-validator";
import { nivelAsignado } from "src/docentes/entities/docente.entity";
import { Role } from "src/usuarios/entities/usuario.entity";

export class RegisterDto {

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
    @MaxLength(16, { message: 'La contraseña debe tener un máximo de 16 caracteres.' })
    password: string;

    @IsEnum(Role)
    @IsOptional()
    rol?: Role = Role.DOCENTE;

    @IsString()
    @IsNotEmpty()
    nombres: string;

    @IsString()
    @IsNotEmpty()
    apellidos: string;

    @IsString()
    @IsNotEmpty()
    cedula: string;

    @IsString()
    @IsNotEmpty()
    @Length(10, 10)
    telefono: string;
    
    @IsEnum(nivelAsignado)
    @IsNotEmpty()
    nivel_asignado: nivelAsignado;
}