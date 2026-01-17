import { IsNotEmpty, IsUUID } from "class-validator";

export class GenerarPromediosMasivoDto {
    @IsNotEmpty()
    @IsUUID()
    trimestre_id: string;
}