import { forwardRef, Module } from '@nestjs/common';
import { PeriodosLectivosService } from './periodos-lectivos.service';
import { PeriodosLectivosController } from './periodos-lectivos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodoLectivo } from './entities/periodos-lectivo.entity';
import { TrimestresModule } from 'src/trimestres/trimestres.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PeriodoLectivo]),
    forwardRef(() => TrimestresModule )
  ],
  controllers: [PeriodosLectivosController],
  providers: [PeriodosLectivosService],
  exports: [PeriodosLectivosService]
})
export class PeriodosLectivosModule {}
