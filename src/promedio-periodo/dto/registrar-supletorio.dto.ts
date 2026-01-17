import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class RegistrarSupletorioDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10)
  nota_supletorio: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}