import { Module } from '@nestjs/common';
import { MatriculasService } from './matriculas.service';
import { MatriculasController } from './matriculas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Matricula } from './entities/matricula.entity';
import { EstudiantesModule } from '../estudiantes/estudiantes.module';
import { CursosModule } from '../cursos/cursos.module';
import { PeriodosLectivosModule } from '../periodos-lectivos/periodos-lectivos.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([Matricula]),
    EstudiantesModule,
    CursosModule,
    PeriodosLectivosModule,

    MulterModule.register({
      dest: './uploads',
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
      }
    }),
    CacheModule.register({
      ttl: 600000,
      max: 100,
    }),
  ],
  controllers: [MatriculasController],
  providers: [MatriculasService],
  exports: [MatriculasService],
})
export class MatriculasModule {}
