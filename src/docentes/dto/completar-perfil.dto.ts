import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CompletarPerfilDto {
  @IsUrl()
  @IsNotEmpty()
  foto_perfil_url?: string;

  @IsString()
  @IsNotEmpty()
  telefono?: string;

  @IsUrl()
  @IsNotEmpty()
  foto_titulo_url?: string;
}