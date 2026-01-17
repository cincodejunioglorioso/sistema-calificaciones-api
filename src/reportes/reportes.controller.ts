import { Controller, Get, Query, Param, HttpStatus, HttpCode, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocenteGuard } from '../auth/guards/docente.guard';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) { }

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
 
  // GET PDF de libreta por matrícula (reportes históricos)
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

  // GET datos JSON de libreta por matrícula
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
   * GET PDF de reporte de materia
   */
  @Get('materia/:materia_curso_id/pdf')
  @UseGuards(DocenteGuard)
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

  // Mantener los endpoints de datos JSON para el frontend
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

    // Obtener info del curso para nombre descriptivo
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=libretas_curso_${timestamp}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}