import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { ReporteEstudianteService } from './services/reporte-estudiante.service';
import { ReporteMateriaService } from './services/reporte-materia.service';

// Entities
import { PromedioTrimestre } from '../promedio-trimestre/entities/promedio-trimestre.entity';
import { PromedioPeriodo } from '../promedio-periodo/entities/promedio-periodo.entity';
import { Matricula } from '../matriculas/entities/matricula.entity';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';
import { Trimestre } from '../trimestres/entities/trimestre.entity';

// Services externos
import { EstudiantesModule } from '../estudiantes/estudiantes.module';
import { TrimestresModule } from '../trimestres/trimestres.module';
import { PromedioTrimestreModule } from '../promedio-trimestre/promedio-trimestre.module';
import { TiposEvaluacionModule } from '../tipos-evaluacion/tipos-evaluacion.module';
import { CursosModule } from '../cursos/cursos.module';
import { PdfGeneratorService } from './services/pdf-generator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PromedioTrimestre,
      PromedioPeriodo,
      Matricula,
      MateriaCurso,
      Trimestre,
    ]),
    EstudiantesModule,
    TrimestresModule,
    PromedioTrimestreModule,
    TiposEvaluacionModule,
    CursosModule,
  ],
  controllers: [ReportesController],
  providers: [
    ReportesService,
    ReporteEstudianteService,
    ReporteMateriaService,
    PdfGeneratorService
  ],
  exports: [ReportesService],
})
export class ReportesModule {}