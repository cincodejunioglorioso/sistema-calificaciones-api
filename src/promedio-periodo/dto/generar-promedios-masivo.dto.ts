import { IsNotEmpty, IsUUID } from "class-validator";

export class GenerarPromediosPeriodoMasivoDto {
  @IsNotEmpty()
  @IsUUID()
  periodo_lectivo_id: string;
}