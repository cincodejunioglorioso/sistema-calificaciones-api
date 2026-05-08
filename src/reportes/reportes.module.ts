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
import { CalificacionCualitativaModule } from '../calificacion-cualitativa/calificacion-cualitativa.module';
import { ReporteConcentradoService } from './services/reporte-concentrado.service';
import { Insumo } from '../insumos/entities/insumo.entity';
import { CalificacionInsumo } from '../calificacion_insumo/entities/calificacion_insumo.entity';
import { ReporteInsumosService } from './services/reporte-insumos.service';
import { ReporteRendimientoAnualService } from './services/reporte-rendimiento-anual.service';
import { PeriodoLectivo } from '../periodos-lectivos/entities/periodos-lectivo.entity';
import { CalificacionComponenteCualitativo } from '../calificacion-cualitativa/entities/calificacion-cualitativa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PromedioTrimestre,
      PromedioPeriodo,
      Matricula,
      MateriaCurso,
      Trimestre,
      Insumo,
      CalificacionInsumo,
      PeriodoLectivo,
      CalificacionComponenteCualitativo
    ]),
    EstudiantesModule,
    TrimestresModule,
    PromedioTrimestreModule,
    TiposEvaluacionModule,
    CursosModule,
    CalificacionCualitativaModule,
  ],
  controllers: [ReportesController],
  providers: [
    ReportesService,
    ReporteEstudianteService,
    ReporteMateriaService,
    ReporteConcentradoService,
    ReporteInsumosService,
    ReporteRendimientoAnualService,
    PdfGeneratorService
  ],
  exports: [ReportesService],
})
export class ReportesModule {}