import { Module } from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service';
import { EstudiantesController } from './estudiantes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estudiante } from './entities/estudiante.entity';
import { PeriodosLectivosModule } from '../periodos-lectivos/periodos-lectivos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Estudiante]),
    PeriodosLectivosModule,
  ],
  controllers: [EstudiantesController],
  providers: [EstudiantesService],
  exports: [EstudiantesService],
})
export class EstudiantesModule {}
