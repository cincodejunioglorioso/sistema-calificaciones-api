import { Module } from '@nestjs/common';
import { MateriasService } from './materias.service';
import { MateriasController } from './materias.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Materia } from './entities/materia.entity';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Materia, MateriaCurso])],
  controllers: [MateriasController],
  providers: [MateriasService],
  exports: [MateriasService]
})

export class MateriasModule {}
