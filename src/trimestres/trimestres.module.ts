import { forwardRef, Module } from '@nestjs/common';
import { TrimestresService } from './trimestres.service';
import { TrimestresController } from './trimestres.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trimestre } from './entities/trimestre.entity';
import { PeriodosLectivosModule } from '../periodos-lectivos/periodos-lectivos.module';
import { Insumo } from '../insumos/entities/insumo.entity';
import { CalificacionExamen } from '../calificacion-examen/entities/calificacion-examen.entity';
import { CalificacionProyecto } from '../calificacion-proyecto/entities/calificacion-proyecto.entity';
import { Matricula } from '../matriculas/entities/matricula.entity';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';
import { PromedioTrimestreModule } from '../promedio-trimestre/promedio-trimestre.module';
import { InsumosModule } from '../insumos/insumos.module';
import { PromedioPeriodoModule } from '../promedio-periodo/promedio-periodo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trimestre,
      Insumo,
      CalificacionExamen,
      CalificacionProyecto,
      Matricula,
      MateriaCurso
    ]),
    forwardRef(() => PeriodosLectivosModule),
    forwardRef(() => InsumosModule),
    forwardRef(() => PromedioTrimestreModule),
    forwardRef(() => PromedioPeriodoModule),
  ],
  controllers: [TrimestresController],
  providers: [TrimestresService],
  exports: [TrimestresService]
})
export class TrimestresModule {}
