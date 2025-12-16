import { Module } from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CursosController } from './cursos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Curso } from './entities/curso.entity';
import { PeriodosLectivosModule } from '../periodos-lectivos/periodos-lectivos.module';
import { TrimestresModule } from '../trimestres/trimestres.module';
import { DocentesModule } from '../docentes/docentes.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Curso]),
    UsuariosModule,
    DocentesModule,
    PeriodosLectivosModule,
    TrimestresModule
  ],
  controllers: [CursosController],
  providers: [CursosService],
  exports: [CursosService]
})
export class CursosModule {}
