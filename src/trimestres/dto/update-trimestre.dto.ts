import { PartialType } from '@nestjs/mapped-types';
import { CreateTrimestreDto } from './create-trimestre.dto';

export class UpdateTrimestreDto extends PartialType(CreateTrimestreDto) {}
