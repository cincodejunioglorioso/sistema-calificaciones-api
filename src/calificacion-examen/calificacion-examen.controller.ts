import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { CalificacionExamenService } from './calificacion-examen.service';
import { CreateCalificacionExamenDto } from './dto/create-calificacion-examen.dto';
import { UpdateCalificacionExamenDto } from './dto/update-calificacion-examen.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocenteGuard } from '../auth/guards/docente.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('calificacion-examen')
@UseGuards(JwtAuthGuard)
export class CalificacionExamenController {
  constructor(private readonly calificacionExamenService: CalificacionExamenService) {}


  //🎓 DOCENTE: Crear calificación (individual o lote)
  @Post()
  @UseGuards(DocenteGuard)
  create(@Body() createCalificacionExamenDto: CreateCalificacionExamenDto, @Req() req: any) {
    return this.calificacionExamenService.create(createCalificacionExamenDto, req.user.docente_id);
  }

  //👑 ADMIN: Listar todas
  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.calificacionExamenService.findAll();
  }

  //🎓 DOCENTE + 👑 ADMIN: Listar por materia-curso y trimestre
  @Get('materia-curso/:materia_curso_id/trimestre/:trimestre_id')
  @UseGuards(DocenteGuard)
  findByMateriaCursoYTrimestre(
    @Param('materia_curso_id') materia_curso_id: string,
    @Param('trimestre_id') trimestre_id: string,
    @Query('admin') isAdmin: string,
    @Req() req: any
  ) {
    const docente_id = isAdmin === 'true' ? undefined : req.user.docente_id;
    return this.calificacionExamenService.findByMateriaCursoYTrimestre(materia_curso_id, trimestre_id, docente_id);
  }

  //🎓 DOCENTE + 👑 ADMIN: Estudiantes sin calificar
  @Get('materia-curso/:materia_curso_id/trimestre/:trimestre_id/sin-calificar')
  @UseGuards(DocenteGuard)
  estudiantesSinCalificar(
    @Param('materia_curso_id') materia_curso_id: string,
    @Param('trimestre_id') trimestre_id: string,
    @Query('admin') isAdmin: string,
    @Req() req: any
  ) {
    const docente_id = isAdmin === 'true' ? undefined : req.user.docente_id;
    return this.calificacionExamenService.estudiantesSinCalificar(materia_curso_id, trimestre_id, docente_id);
  }

  //🎓 DOCENTE + 👑 ADMIN: Listar por estudiante
  @Get('estudiante/:estudiante_id')
  @UseGuards(DocenteGuard)
  findByEstudiante(@Param('estudiante_id') estudiante_id: string) {
    return this.calificacionExamenService.findByEstudiante(estudiante_id);
  }

  //🎓 DOCENTE + 👑 ADMIN: Obtener calificación específica
  @Get(':id')
  @UseGuards(DocenteGuard)
  findOne(@Param('id') id: string, @Query('admin') isAdmin: string, @Req() req: any) {
    const docente_id = isAdmin === 'true' ? undefined : req.user.docente_id;
    return this.calificacionExamenService.findOne(id, docente_id);
  }

  //🎓 DOCENTE: Actualizar calificación
  @Patch(':id')
  @UseGuards(DocenteGuard)
  update(@Param('id') id: string, @Body() updateCalificacionExamenDto: UpdateCalificacionExamenDto, @Req() req: any) {
    return this.calificacionExamenService.update(id, updateCalificacionExamenDto, req.user.docente_id);
  }

  //🎓 DOCENTE + 👑 ADMIN: Eliminar calificación
  @Delete(':id')
  @UseGuards(DocenteGuard)
  remove(@Param('id') id: string, @Query('admin') isAdmin: string, @Req() req: any) {
    const docente_id = isAdmin === 'true' ? undefined : req.user.docente_id;
    return this.calificacionExamenService.remove(id, docente_id);
  }
}
