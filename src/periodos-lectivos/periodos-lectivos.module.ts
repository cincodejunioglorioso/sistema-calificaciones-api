import { forwardRef, Module } from '@nestjs/common';
import { PeriodosLectivosService } from './periodos-lectivos.service';
import { PeriodosLectivosController } from './periodos-lectivos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodoLectivo } from './entities/periodos-lectivo.entity';
import { TrimestresModule } from '../trimestres/trimestres.module';
import { PromedioPeriodoModule } from '../promedio-periodo/promedio-periodo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PeriodoLectivo]),
    forwardRef(() => TrimestresModule),
    forwardRef(() => PromedioPeriodoModule),
  ],
  controllers: [PeriodosLectivosController],
  providers: [PeriodosLectivosService],
  exports: [PeriodosLectivosService]
})
export class PeriodosLectivosModule {}
