import { Module } from '@nestjs/common';
import { MateriaCursoService } from './materia-curso.service';
import { MateriaCursoController } from './materia-curso.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MateriaCurso } from './entities/materia-curso.entity';
import { CursosModule } from '../cursos/cursos.module';
import { DocentesModule } from '../docentes/docentes.module';
import { MateriasModule } from '../materias/materias.module';
import { PeriodosLectivosModule } from '../periodos-lectivos/periodos-lectivos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MateriaCurso]),
    CursosModule,
    DocentesModule,
    MateriasModule,
    PeriodosLectivosModule,
  ],
  controllers: [MateriaCursoController],
  providers: [MateriaCursoService],
  exports: [MateriaCursoService],
})
export class MateriaCursoModule {}
