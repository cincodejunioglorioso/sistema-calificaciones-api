import { IsOptional, IsString, IsEnum, IsUrl, Min, IsEmail, ValidateIf } from 'class-validator';
import { NivelAsignado } from '../entities/docente.entity';
import { Role } from '../../usuarios/entities/usuario.entity';

export class UpdateDocenteDto {
  @IsOptional()
  @IsString()
  nombres?: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEnum(NivelAsignado)
  nivelAsignado?: NivelAsignado;

  @IsOptional()
  @ValidateIf((o) => o.foto_perfil_url && o.foto_perfil_url.trim() !== '')
  @IsUrl({})
  foto_perfil_url?: string;

  @IsOptional()
  @ValidateIf((o) => o.foto_titulo_url && o.foto_titulo_url.trim() !== '')
  @IsUrl({})
  foto_titulo_url?: string;
}