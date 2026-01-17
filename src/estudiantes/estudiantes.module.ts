import { Module } from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service';
import { EstudiantesController } from './estudiantes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estudiante } from './entities/estudiante.entity';
import { PeriodosLectivosModule } from '../periodos-lectivos/periodos-lectivos.module';
import { CursosModule } from '../cursos/cursos.module';
import { Matricula } from '../matriculas/entities/matricula.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Estudiante, Matricula]),
    PeriodosLectivosModule,
    CursosModule
  ],
  controllers: [EstudiantesController],
  providers: [EstudiantesService],
  exports: [EstudiantesService],
})
export class EstudiantesModule {}
