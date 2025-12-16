import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CompletarPerfilDto {
  
  @IsOptional()
  @IsUrl()
  foto_perfil_url?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsUrl()
  foto_titulo_url?: string;
}