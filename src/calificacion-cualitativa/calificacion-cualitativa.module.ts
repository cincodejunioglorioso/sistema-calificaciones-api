import { forwardRef, Module } from '@nestjs/common';
import { CalificacionCualitativaService } from './calificacion-cualitativa.service';
import { CalificacionCualitativaController } from './calificacion-cualitativa.controller';
import { CalificacionComponenteCualitativo } from './entities/calificacion-cualitativa.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Materia } from '../materias/entities/materia.entity';
import { Trimestre } from '../trimestres/entities/trimestre.entity';
import { Curso } from '../cursos/entities/curso.entity';
import { CursosModule } from '../cursos/cursos.module';
import { Matricula } from '../matriculas/entities/matricula.entity';
import { TrimestresModule } from '../trimestres/trimestres.module';

@Module({
  imports: [TypeOrmModule.forFeature(
    [
      CalificacionComponenteCualitativo,
      Materia,
      Trimestre,
      Curso,
      Matricula
    ]),
    forwardRef(() => CursosModule),
    forwardRef(() => TrimestresModule),
  ],
  controllers: [CalificacionCualitativaController],
  providers: [CalificacionCualitativaService],
  exports: [CalificacionCualitativaService],
})
export class CalificacionCualitativaModule { }
