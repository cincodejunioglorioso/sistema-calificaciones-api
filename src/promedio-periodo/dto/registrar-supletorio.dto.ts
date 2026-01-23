import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class RegistrarSupletorioDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(7)
  nota_supletorio: number;
}