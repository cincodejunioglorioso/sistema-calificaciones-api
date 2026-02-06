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
import { InsumosModule } from './insumos/insumos.module';
import { TiposEvaluacionModule } from './tipos-evaluacion/tipos-evaluacion.module';
import { CalificacionInsumoModule } from './calificacion_insumo/calificacion_insumo.module';
import { RecuperacionInsumoModule } from './recuperacion_insumo/recuperacion_insumo.module';
import { CalificacionProyectoModule } from './calificacion-proyecto/calificacion-proyecto.module';
import { CalificacionExamenModule } from './calificacion-examen/calificacion-examen.module';
import { PromedioTrimestreModule } from './promedio-trimestre/promedio-trimestre.module';
import { PromedioPeriodoModule } from './promedio-periodo/promedio-periodo.module';
import { ReportesModule } from './reportes/reportes.module';
import { CalificacionCualitativaModule } from './calificacion-cualitativa/calificacion-cualitativa.module';
import { RecuperacionExamenModule } from './recuperacion-examen/recuperacion-examen.module';

@Module({  
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: false,
            ssl: { rejectUnauthorized: false },
          };
        }

        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          database: configService.get('DB_NAME'),
          password: configService.get('DB_PASSWORD'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: false,
        };
      },
      inject: [ConfigService],
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

    MatriculasModule,

    InsumosModule,

    TiposEvaluacionModule,

    CalificacionInsumoModule,

    RecuperacionInsumoModule,

    CalificacionProyectoModule,

    CalificacionExamenModule,

    PromedioTrimestreModule,

    PromedioPeriodoModule,

    ReportesModule,

    CalificacionCualitativaModule,

    RecuperacionExamenModule,

  ],
})
export class AppModule {} 
