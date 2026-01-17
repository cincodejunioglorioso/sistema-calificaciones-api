import { Module } from '@nestjs/common';
import { CalificacionProyectoService } from './calificacion-proyecto.service';
import { CalificacionProyectoController } from './calificacion-proyecto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalificacionProyecto } from './entities/calificacion-proyecto.entity';
import { Curso } from '../cursos/entities/curso.entity';
import { Trimestre } from '../trimestres/entities/trimestre.entity';
import { Matricula } from '../matriculas/entities/matricula.entity';
import { CursosModule } from '../cursos/cursos.module';

@Module({
  imports: [TypeOrmModule.forFeature([
    CalificacionProyecto,
    Curso,
    Trimestre,
    Matricula
  ]),
    CursosModule
  ],
  controllers: [CalificacionProyectoController],
  providers: [CalificacionProyectoService],
  exports: [CalificacionProyectoService],
})
export class CalificacionProyectoModule { }
