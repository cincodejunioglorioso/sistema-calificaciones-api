// nest-backend/src/reportes/reportes.service.ts
import { Injectable } from '@nestjs/common';
import { ReporteEstudianteService } from './services/reporte-estudiante.service';
import { ReporteMateriaService } from './services/reporte-materia.service';
import { DatosLibretaEstudiante } from './interfaces/datos-libreta.interface';
import { DatosReporteMateria } from './interfaces/datos-reporte-materia.interface';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoMatricula, Matricula } from '../matriculas/entities/matricula.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReportesService {
  constructor(
    private readonly reporteEstudianteService: ReporteEstudianteService,
    private readonly reporteMateriaService: ReporteMateriaService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) { }

  /**
   * Genera datos para libreta individual de estudiante
   */
  async generarDatosLibretaEstudiante(
    estudiante_id: string,
    trimestre_id: string,
    usuario_id?: string,
    docente_id?: string
  ): Promise<DatosLibretaEstudiante> {
    return this.reporteEstudianteService.obtenerDatosLibreta(
      estudiante_id,
      trimestre_id,
      usuario_id,
      docente_id
    );
  }

 // Genera datos para libreta usando matricula_id 
  async generarDatosLibretaPorMatricula(
    matricula_id: string
  ): Promise<DatosLibretaEstudiante> {
    return this.reporteEstudianteService.obtenerDatosLibretaPorMatricula(matricula_id);
  }

  
  // Genera PDF de libreta usando matricula_id
  async generarLibretaPorMatriculaPDF(
    matricula_id: string
  ): Promise<Buffer> {
    const datos = await this.generarDatosLibretaPorMatricula(matricula_id);
    return this.pdfGeneratorService.generarLibretaPDF(datos);
  }

  async generarLibretasCursoConsolidado(
    curso_id: string,
    trimestre_id: string,
    docente_id?: string
  ): Promise<Buffer> {
    // 1. Obtener todos los estudiantes matriculados en el curso (ordenados alfabéticamente)
    const matriculas = await this.matriculaRepository.find({
      where: {
        curso_id,
        estado: EstadoMatricula.ACTIVO
      },
      relations: ['estudiante', 'curso'],
      order: {
        estudiante: { nombres_completos: 'ASC' }
      }
    });

    if (matriculas.length === 0) {
      throw new Error('No hay estudiantes matriculados en este curso');
    }

    // 2. Generar datos de libreta para cada estudiante
    const datosLibretas: DatosLibretaEstudiante[] = await Promise.all(
      matriculas.map(matricula =>
        this.reporteEstudianteService.obtenerDatosLibreta(
          matricula.estudiante_id,
          trimestre_id,
          undefined,
          docente_id
        )
      )
    );

    // 3. Generar PDF consolidado
    return this.pdfGeneratorService.generarLibretasConsolidadas(datosLibretas);
  }

  /**
   * Genera datos para reporte de materia-curso
   */
  async generarDatosReporteMateria(
    materia_curso_id: string,
    trimestre_id: string
  ): Promise<DatosReporteMateria> {
    return this.reporteMateriaService.obtenerDatosReporteMateria(
      materia_curso_id,
      trimestre_id
    );
  }

  async generarLibretaPDF(
    estudiante_id: string,
    trimestre_id: string,
    usuario_id?: string,
    docente_id?: string
  ): Promise<Buffer> {
    const datos = await this.generarDatosLibretaEstudiante(
      estudiante_id,
      trimestre_id,
      usuario_id,
      docente_id
    );

    return this.pdfGeneratorService.generarLibretaPDF(datos);
  }

  /**
   * Genera PDF de reporte de materia
   */
  async generarReporteMateriaPDF(
    materia_curso_id: string,
    trimestre_id: string
  ): Promise<Buffer> {
    const datos = await this.generarDatosReporteMateria(materia_curso_id, trimestre_id);
    return this.pdfGeneratorService.generarReporteMateriaPDF(datos);
  }
}