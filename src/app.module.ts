import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsuariosModule } from './usuarios/usuarios.module';
import { DocentesModule } from './docentes/docentes.module';
import { AuthModule } from './auth/auth.module'; 
import { MateriasModule } from './materias/materias.module';
import { PeriodosLectivosModule } from './periodos-lectivos/periodos-lectivos.module';
import { TrimestresModule } from './trimestres/trimestres.module';
import { CursosModule } from './cursos/cursos.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';
import { MateriaCursoModule } from './materia-curso/materia-curso.module';
import { MatriculasModule } from './matriculas/matriculas.module';

@Module({  
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        database: configService.get('DB_NAME'),
        password: configService.get('DB_PASSWORD'),
        entities: [ __dirname + '/../**/*.entity{.ts,.js}' ],
        synchronize: false
      }),
      inject: [ConfigService]
    }),

    UsuariosModule,

    DocentesModule,

    AuthModule,

    MateriasModule,

    PeriodosLectivosModule,

    TrimestresModule,

    CursosModule,

    EstudiantesModule,

    MateriaCursoModule,

    MatriculasModule
  ],
})
export class AppModule {} 
