import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromedioPeriodoService } from './promedio-periodo.service';
import { PromedioPeriodoController } from './promedio-periodo.controller';
import { PromedioPeriodo } from './entities/promedio-periodo.entity';
import { PromedioTrimestre } from '../promedio-trimestre/entities/promedio-trimestre.entity';
import { Matricula } from '../matriculas/entities/matricula.entity';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';
import { PeriodoLectivo } from '../periodos-lectivos/entities/periodos-lectivo.entity';
import { Trimestre } from '../trimestres/entities/trimestre.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PromedioPeriodo,
      PromedioTrimestre,
      Matricula,
      MateriaCurso,
      PeriodoLectivo,
      Trimestre,
    ]),
  ],
  controllers: [PromedioPeriodoController],
  providers: [PromedioPeriodoService],
  exports: [PromedioPeriodoService],
})
export class PromedioPeriodoModule {}