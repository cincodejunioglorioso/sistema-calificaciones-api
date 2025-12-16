import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum, MaxLength, Length } from "class-validator";
import { NivelAsignado } from "../../docentes/entities/docente.entity";
import { Role } from "../../usuarios/entities/usuario.entity";

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
    @IsNotEmpty()
    rol: Role;

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
    
    @IsEnum(NivelAsignado)
    @IsNotEmpty()
    nivel_asignado: NivelAsignado;
}