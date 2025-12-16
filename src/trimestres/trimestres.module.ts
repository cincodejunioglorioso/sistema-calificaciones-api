import { forwardRef, Module } from '@nestjs/common';
import { TrimestresService } from './trimestres.service';
import { TrimestresController } from './trimestres.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trimestre } from './entities/trimestre.entity';
import { PeriodosLectivosModule } from '../periodos-lectivos/periodos-lectivos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trimestre]),
    forwardRef(() => PeriodosLectivosModule)
  ],
  controllers: [TrimestresController],
  providers: [TrimestresService],
  exports: [TrimestresService]
})
export class TrimestresModule {}
