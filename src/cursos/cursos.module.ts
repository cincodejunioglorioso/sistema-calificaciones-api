import { forwardRef, Module } from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CursosController } from './cursos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Curso } from './entities/curso.entity';
import { PeriodosLectivosModule } from '../periodos-lectivos/periodos-lectivos.module';
import { TrimestresModule } from '../trimestres/trimestres.module';
import { DocentesModule } from '../docentes/docentes.module';
import { MateriaCursoModule } from '../materia-curso/materia-curso.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Curso]),
    DocentesModule,
    PeriodosLectivosModule,
    TrimestresModule,
    forwardRef(() => MateriaCursoModule)
  ],
  controllers: [CursosController],
  providers: [CursosService],
  exports: [CursosService]
})
export class CursosModule {}
