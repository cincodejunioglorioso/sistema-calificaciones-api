import { Module } from '@nestjs/common';
import { CalificacionExamenService } from './calificacion-examen.service';
import { CalificacionExamenController } from './calificacion-examen.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalificacionExamen } from './entities/calificacion-examen.entity';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';
import { Trimestre } from '../trimestres/entities/trimestre.entity';
import { Matricula } from '../matriculas/entities/matricula.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    CalificacionExamen,
    MateriaCurso,
    Trimestre,
    Matricula
  ])],
  controllers: [CalificacionExamenController],
  providers: [CalificacionExamenService],
  exports: [CalificacionExamenService]
})
export class CalificacionExamenModule {}
