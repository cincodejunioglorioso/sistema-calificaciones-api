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
  // RUTAS ESPECÍFICAS PRIMERO (con texto literal)
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
    const pdfBuffer = await this.reportesService.generarLibretaPDF(
      estudiante_id,
      trimestre_id,
      req.user.id,
      req.user.docente_id
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=libreta_${estudiante_id}.pdf`,
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
    const pdfBuffer = await this.reportesService.generarLibretaPorMatriculaPDF(matricula_id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=libreta_historica_${matricula_id}.pdf`,
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
    const pdfBuffer = await this.reportesService.generarLibretasCursoConsolidado(
      curso_id,
      trimestre_id,
      req.user.docente_id
    );

    const timestamp = new Date().toISOString().split('T')[0];

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=libretas_curso_${timestamp}.pdf`,
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
    const pdfBuffer = await this.reportesService.generarConcentradoPDF(
      curso_id,
      trimestre_id,
      req.user.docente_id
    );

    const timestamp = new Date().toISOString().split('T')[0];

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=concentrado_calificaciones_${timestamp}.pdf`,
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
   * ⚠️ DEBE IR ANTES de /materia/:materia_curso_id
   */
  @Get('insumos/:materia_curso_id/pdf')
  @UseGuards(DocenteGuard)
  async descargarReporteInsumosPDF(
    @Param('materia_curso_id') materia_curso_id: string,
    @Query('trimestre_id') trimestre_id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportesService.generarReporteInsumosPDF(
      materia_curso_id,
      trimestre_id
    );

    const timestamp = new Date().toISOString().split('T')[0];

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=reporte_insumos_${timestamp}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  /**
   * GET datos JSON de reporte de insumos
   * ⚠️ DEBE IR ANTES de /materia/:materia_curso_id
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
    const pdfBuffer = await this.reportesService.generarRendimientoAnualPDF(
      materia_curso_id,
      periodo_lectivo_id
    );

    const timestamp = new Date().toISOString().split('T')[0];

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=rendimiento_anual_${timestamp}.pdf`,
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
  // RUTAS GENÉRICAS AL FINAL (pueden capturar texto literal)
  // ==========================================

  /**
   * GET PDF de reporte de materia
   * ⚠️ Esta ruta es genérica y debe ir DESPUÉS de /insumos
   */
  @Get('materia/:materia_curso_id/pdf')
  @UseGuards(DocenteOrAdminGuard)

  async descargarReporteMateriaPDF(
    @Param('materia_curso_id') materia_curso_id: string,
    @Query('trimestre_id') trimestre_id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportesService.generarReporteMateriaPDF(
      materia_curso_id,
      trimestre_id
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=reporte_materia_${materia_curso_id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  /**
   * GET datos JSON de reporte de materia
   * ⚠️ Esta ruta es genérica y debe ir DESPUÉS de /insumos
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