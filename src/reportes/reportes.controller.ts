import { Controller, Get, Query, Param, HttpStatus, HttpCode, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocenteGuard } from '../auth/guards/docente.guard';
import { DocenteOrAdminGuard } from '../auth/guards/docente-or-admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) { }

  // ==========================================
  // RUTAS ESPECÍFICAS
  // ==========================================

  /**
   * GET PDF de libreta de estudiante
   */
  @Get('libreta/estudiante/:estudiante_id/pdf')
  @UseGuards(DocenteGuard)
  async descargarLibretaPDF(
    @Param('estudiante_id') estudiante_id: string,
    @Query('trimestre_id') trimestre_id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    // 1. Obtenemos los datos
    const datos = await this.reportesService.generarDatosLibretaEstudiante(
      estudiante_id,
      trimestre_id,
      req.user.id,
      req.user.docente_id
    );

    const pdfBuffer = await this.reportesService.generarLibretaPDF(
      estudiante_id,
      trimestre_id,
      req.user.id,
      req.user.docente_id
    );

    // 2. SOLUCIÓN AL ERROR:
    // Buscamos el trimestre actual dentro del array de trimestres para sacar el nombre
    // Tu interfaz dice que trimestres es CalificacionesTrimestreLibreta[]
    const trimestreActual = datos.trimestres.find(t => t.trimestre_estado === 'FINALIZADO' || t.materias.length > 0);

    // Si por alguna razón no lo encuentra, usamos un fallback
    const nombreTrimestre = trimestreActual
      ? trimestreActual.trimestre_nombre.replace(/\s+/g, '_')
      : 'Reporte';

    const nombreEstudiante = datos.estudiante.nombres_completos.replace(/\s+/g, '_');
    const nombreArchivo = `Libreta_${nombreEstudiante}_${nombreTrimestre}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  /**
   * GET datos JSON de libreta de estudiante
   */
  @Get('libreta/estudiante/:estudiante_id')
  @UseGuards(DocenteGuard)
  @HttpCode(HttpStatus.OK)
  async obtenerDatosLibretaEstudiante(
    @Param('estudiante_id') estudiante_id: string,
    @Query('trimestre_id') trimestre_id: string,
    @Request() req: any,
  ) {
    const datos = await this.reportesService.generarDatosLibretaEstudiante(
      estudiante_id,
      trimestre_id,
      req.user.id,
      req.user.docente_id
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Datos de libreta obtenidos exitosamente',
      data: datos,
    };
  }

  /**
   * GET PDF de libreta por matrícula (reportes históricos)
   */
  @Get('libreta/matricula/:matricula_id/pdf')
  async descargarLibretaPorMatriculaPDF(
    @Param('matricula_id') matricula_id: string,
    @Res() res: Response,
  ) {

    const datos = await this.reportesService.generarDatosLibretaPorMatricula(matricula_id);
    const pdfBuffer = await this.reportesService.generarLibretaPorMatriculaPDF(matricula_id);

    const nombreEstudiante = datos.estudiante.nombres_completos.replace(/\s+/g, '_');
    const periodo = datos.periodo.nombre.replace(/\s+/g, '_');
    const nombreArchivo = `Libreta_${nombreEstudiante}_${periodo}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${nombreArchivo}`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  /**
   * GET datos JSON de libreta por matrícula
   */
  @Get('libreta/matricula/:matricula_id')
  @HttpCode(HttpStatus.OK)
  async obtenerDatosLibretaPorMatricula(
    @Param('matricula_id') matricula_id: string,
  ) {
    const datos = await this.reportesService.generarDatosLibretaPorMatricula(matricula_id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Datos de libreta histórica obtenidos exitosamente',
      data: datos,
    };
  }

  /**
   * GET PDF de libretas consolidadas del curso
   */
  @Get('libreta/curso/:curso_id/consolidado')
  @UseGuards(DocenteGuard)
  async descargarLibretasConsolidadas(
    @Param('curso_id') curso_id: string,
    @Query('trimestre_id') trimestre_id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {

    const datosRanking = await this.reportesService.generarDatosConcentrado(
      curso_id,
      trimestre_id,
      req.user.docente_id
    );

    const pdfBuffer = await this.reportesService.generarLibretasCursoConsolidado(
      curso_id,
      trimestre_id,
      req.user.docente_id
    );

    const nivel = datosRanking.curso.nivel.replace(/\s+/g, '_');
    const paralelo = datosRanking.curso.paralelo;
    const trimestre = datosRanking.trimestre.nombre.replace(/\s+/g, '_');

    const nombreArchivo = `Consolidado_${nivel}_${paralelo}_${trimestre}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  /**
   * GET PDF de concentrado de calificaciones (ranking del curso)
   */
  @Get('concentrado/curso/:curso_id/pdf')
  @UseGuards(DocenteGuard)
  async descargarConcentradoPDF(
    @Param('curso_id') curso_id: string,
    @Query('trimestre_id') trimestre_id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const datos = await this.reportesService.generarDatosConcentrado(
      curso_id,
      trimestre_id,
      req.user.docente_id
    );
    const pdfBuffer = await this.reportesService.generarConcentradoPDF(
      curso_id,
      trimestre_id,
      req.user.docente_id
    );

    const nivel = datos.curso.nivel.replace(/\s+/g, '_');
    const paralelo = datos.curso.paralelo;
    const trimestre = datos.trimestre.nombre.replace(/\s+/g, '_');
    const nombreArchivo = `Concentrado_${nivel}_${paralelo}_${trimestre}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${nombreArchivo}`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  /**
   * GET datos JSON de concentrado de calificaciones
   */
  @Get('concentrado/curso/:curso_id')
  @UseGuards(DocenteGuard)
  @HttpCode(HttpStatus.OK)
  async obtenerDatosConcentrado(
    @Param('curso_id') curso_id: string,
    @Query('trimestre_id') trimestre_id: string,
    @Request() req: any,
  ) {
    const datos = await this.reportesService.generarDatosConcentrado(
      curso_id,
      trimestre_id,
      req.user.docente_id
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Datos de concentrado obtenidos exitosamente',
      data: datos,
    };
  }

  /**
   * GET PDF de reporte de insumos
   */
  @Get('insumos/:materia_curso_id/pdf')
  @UseGuards(DocenteGuard)
  async descargarReporteInsumosPDF(
    @Param('materia_curso_id') materia_curso_id: string,
    @Query('trimestre_id') trimestre_id: string,
    @Res() res: Response,
  ) {
    const datos = await this.reportesService.generarDatosReporteInsumos(
      materia_curso_id,
      trimestre_id
    );
    const pdfBuffer = await this.reportesService.generarReporteInsumosPDF(
      materia_curso_id,
      trimestre_id
    );

    const nivel = datos.curso.nivel.replace(/\s+/g, '_');
    const paralelo = datos.curso.paralelo;
    const materia = datos.materia.nombre.replace(/\s+/g, '_');
    const trimestre = datos.trimestre.nombre.replace(/\s+/g, '_');
    const nombreArchivo = `Aportes_${nivel}_${paralelo}_${materia}_${trimestre}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  /**
   * GET datos JSON de reporte de insumos
   */
  @Get('insumos/:materia_curso_id')
  @UseGuards(DocenteGuard)
  @HttpCode(HttpStatus.OK)
  async obtenerDatosReporteInsumos(
    @Param('materia_curso_id') materia_curso_id: string,
    @Query('trimestre_id') trimestre_id: string,
  ) {
    const datos = await this.reportesService.generarDatosReporteInsumos(
      materia_curso_id,
      trimestre_id
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Datos de reporte de insumos obtenidos exitosamente',
      data: datos,
    };
  }

  /**
 * GET PDF de reporte de rendimiento académico anual
 */
  @Get('rendimiento-anual/:materia_curso_id/pdf')
  @UseGuards(DocenteGuard)
  async descargarRendimientoAnualPDF(
    @Param('materia_curso_id') materia_curso_id: string,
    @Query('periodo_lectivo_id') periodo_lectivo_id: string,
    @Res() res: Response,
  ) {
    const datos = await this.reportesService.generarDatosRendimientoAnual(
      materia_curso_id,
      periodo_lectivo_id
    );
    const pdfBuffer = await this.reportesService.generarRendimientoAnualPDF(
      materia_curso_id,
      periodo_lectivo_id
    );

    const nivel = datos.curso.nivel.replace(/\s+/g, '_');
    const paralelo = datos.curso.paralelo;
    const materia = datos.materia.nombre.replace(/\s+/g, '_');
    const periodo = datos.periodo.nombre.replace(/\s+/g, '_');
    const nombreArchivo = `Rendimiento_${nivel}_${paralelo}_${materia}_${periodo}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${nombreArchivo}`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  /**
   * GET datos JSON de reporte de rendimiento académico anual
   */
  @Get('rendimiento-anual/:materia_curso_id')
  @UseGuards(DocenteOrAdminGuard)
  @HttpCode(HttpStatus.OK)
  async obtenerDatosRendimientoAnual(
    @Param('materia_curso_id') materia_curso_id: string,
    @Query('periodo_lectivo_id') periodo_lectivo_id: string,
  ) {
    const datos = await this.reportesService.generarDatosRendimientoAnual(
      materia_curso_id,
      periodo_lectivo_id
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Datos de rendimiento anual obtenidos exitosamente',
      data: datos,
    };
  }

  // ==========================================
  // RUTAS GENÉRICAS AL FINAL
  // ==========================================

  /**
   * GET PDF de reporte de materia
   */
  @Get('materia/:materia_curso_id/pdf')
  @UseGuards(DocenteOrAdminGuard)

  async descargarReporteMateriaPDF(
    @Param('materia_curso_id') materia_curso_id: string,
    @Query('trimestre_id') trimestre_id: string,
    @Res() res: Response,
  ) {

    const datos = await this.reportesService.generarDatosReporteMateria(
      materia_curso_id,
      trimestre_id
    );
    const pdfBuffer = await this.reportesService.generarReporteMateriaPDF(
      materia_curso_id,
      trimestre_id
    );

    const nivel = datos.curso.nivel.replace(/\s+/g, '_');
    const paralelo = datos.curso.paralelo;
    const materia = datos.materia.nombre.replace(/\s+/g, '_');
    const trimestre = datos.trimestre.nombre.replace(/\s+/g, '_');
    const nombreArchivo = `Rendimiento_${nivel}_${paralelo}_${materia}_${trimestre}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  /**
   * GET datos JSON de reporte de materia
   */
  @Get('materia/:materia_curso_id')
  @UseGuards(DocenteGuard)
  @HttpCode(HttpStatus.OK)
  async obtenerDatosReporteMateria(
    @Param('materia_curso_id') materia_curso_id: string,
    @Query('trimestre_id') trimestre_id: string,
  ) {
    const datos = await this.reportesService.generarDatosReporteMateria(
      materia_curso_id,
      trimestre_id
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Datos de reporte obtenidos exitosamente',
      data: datos,
    };
  }
}