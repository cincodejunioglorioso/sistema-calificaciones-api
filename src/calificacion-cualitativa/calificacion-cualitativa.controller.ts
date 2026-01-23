import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { CalificacionCualitativaService } from './calificacion-cualitativa.service';
import { CreateCalificacionCualitativaDto } from './dto/create-calificacion-cualitativa.dto';
import { UpdateCalificacionCualitativaDto } from './dto/update-calificacion-cualitativa.dto';
import { CalificarMasivoDto } from './dto/batch-calificacion-cualitativa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TutorGuard } from '../auth/guards/tutor.guard';
import { NivelEducativo } from '../materias/entities/materia.entity';
import { DocenteGuard } from '../auth/guards/docente.guard';

@UseGuards(JwtAuthGuard)
@Controller('calificacion-cualitativa')
export class CalificacionCualitativaController {
  constructor(private readonly calificacionService: CalificacionCualitativaService) {}

  /**
   * ⭐ CALIFICACIÓN MASIVA (Tutor guarda toda la tabla)
   */
  @Post('calificar-masivo')
  @UseGuards(TutorGuard)
  async calificarMasivo(@Body() dto: CalificarMasivoDto, @Request() req: any) {
    const docente_id = req.user.docente_id;
    return this.calificacionService.calificarMasivo(dto, docente_id);
  }

  /**
   * Obtener calificaciones por curso y trimestre
   */
  @Get('curso/:curso_id/trimestre/:trimestre_id')
  @UseGuards(TutorGuard)
  findByCursoYTrimestre(
    @Param('curso_id') curso_id: string,
    @Param('trimestre_id') trimestre_id: string,
  ) {
    return this.calificacionService.findByCursoYTrimestre(curso_id, trimestre_id);
  }

  /**
   * Obtener componentes de un estudiante en todo el periodo
   */
  @Get('estudiante/:estudiante_id/periodo/:periodo_id')
  @UseGuards(TutorGuard)
  findByEstudiantePeriodo(
    @Param('estudiante_id') estudiante_id: string,
    @Param('periodo_id') periodo_id: string,
  ) {
    return this.calificacionService.findByEstudiantePeriodo(estudiante_id, periodo_id);
  }

  /**
   * Obtener componentes según nivel educativo
   */
  @Get('componentes/:nivel')
  @UseGuards(DocenteGuard)
  obtenerComponentesPorNivel(@Param('nivel') nivel: NivelEducativo) {
    return this.calificacionService.obtenerComponentesPorNivel(nivel);
  }

  /**
   * CRUD Individual
   */
  @Get(':id')
  @UseGuards(TutorGuard)
  findOne(@Param('id') id: string) {
    return this.calificacionService.findOne(id);
  }

  /**
   * ✏️ Actualizar UNA calificación (Tutor puede usar esto)
   */
  @Patch(':id')
  @UseGuards(TutorGuard)
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCalificacionCualitativaDto,
    @Request() req: any,
  ) {
    const docente_id = req.user.docente_id;
    return this.calificacionService.update(id, updateDto, docente_id);
  }

  /**
   * 🗑️ Eliminar UNA calificación (Tutor puede usar esto)
   */
  @Delete(':id')
  @UseGuards(TutorGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    const docente_id = req.user.docente_id;
    return this.calificacionService.remove(id, docente_id);
  }
}