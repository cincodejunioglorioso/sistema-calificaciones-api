import { Module } from '@nestjs/common';
import { PromedioTrimestreService } from './promedio-trimestre.service';
import { PromedioTrimestreController } from './promedio-trimestre.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromedioTrimestre } from './entities/promedio-trimestre.entity';
import { Insumo } from '../insumos/entities/insumo.entity';
import { TipoEvaluacion } from '../tipos-evaluacion/entities/tipos-evaluacion.entity';
import { CalificacionInsumo } from '../calificacion_insumo/entities/calificacion_insumo.entity';
import { CalificacionProyecto } from '../calificacion-proyecto/entities/calificacion-proyecto.entity';
import { CalificacionExamen } from '../calificacion-examen/entities/calificacion-examen.entity';
import { Matricula } from '../matriculas/entities/matricula.entity';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';
import { Trimestre } from '../trimestres/entities/trimestre.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    PromedioTrimestre,
    Insumo,
    TipoEvaluacion,
    CalificacionInsumo,
    CalificacionProyecto,
    CalificacionExamen,
    Matricula,
    MateriaCurso,
    Trimestre
  ])],
  controllers: [PromedioTrimestreController],
  providers: [PromedioTrimestreService],
  exports: [PromedioTrimestreService]
})
export class PromedioTrimestreModule {}
