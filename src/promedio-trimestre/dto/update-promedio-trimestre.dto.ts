import { IsOptional, IsString } from 'class-validator';

export class UpdatePromedioTrimestreDto {
    @IsOptional()
    @IsString()
    observaciones?: string;
}
