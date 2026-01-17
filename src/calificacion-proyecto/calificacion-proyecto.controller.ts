import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CalificacionProyectoService } from './calificacion-proyecto.service';
import { CreateCalificacionProyectoDto } from './dto/create-calificacion-proyecto.dto';
import { UpdateCalificacionProyectoDto } from './dto/update-calificacion-proyecto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TutorGuard } from '../auth/guards/tutor.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Role } from '../usuarios/entities/usuario.entity';
import { DocenteGuard } from '../auth/guards/docente.guard';

@Controller('calificacion-proyecto')
@UseGuards(JwtAuthGuard)
export class CalificacionProyectoController {
  constructor(private readonly calificacionProyectoService: CalificacionProyectoService) {}

  @Post()
  @UseGuards(TutorGuard)
  async create(
    @Body() createCalificacionProyectoDto: CreateCalificacionProyectoDto,
    @Req() req
  ) {
    return await this.calificacionProyectoService.create(createCalificacionProyectoDto, req.user.docente_id);
  }

  // 👑 ADMIN: Listar todas las calificaciones
  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return await this.calificacionProyectoService.findAll();
  }

  // 🎓 TUTOR + 👑 ADMIN: Obtener calificación por ID
  @Get(':id')
  @UseGuards(DocenteGuard)
  async findOne(@Param('id') id: string, @Req() req) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : undefined;
    return await this.calificacionProyectoService.findOne(id, docente_id);
  }

  // 🎓 TUTOR + 👑 ADMIN: Listar por curso y trimestre
  @Get('curso/:curso_id/trimestre/:trimestre_id')
  @UseGuards(DocenteGuard)
  async findByCursoYTrimestre(
    @Param('curso_id') curso_id: string,
    @Param('trimestre_id') trimestre_id: string,
    @Req() req
  ) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : undefined;
    return await this.calificacionProyectoService.findByCursoYTrimestre(
      curso_id,
      trimestre_id,
      docente_id
    );
  }

  // 🎓 TUTOR + 👑 ADMIN: Estudiantes sin calificar
  @Get('curso/:curso_id/trimestre/:trimestre_id/sin-calificar')
  @UseGuards(DocenteGuard)
  async estudiantesSinCalificar(
    @Param('curso_id') curso_id: string,
    @Param('trimestre_id') trimestre_id: string,
    @Req() req
  ) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : undefined;
    return await this.calificacionProyectoService.estudiantesSinCalificar(
      curso_id,
      trimestre_id,
      docente_id
    );
  }

  // 🎓 TUTOR + 👑 ADMIN: Historial de un estudiante
  @Get('estudiante/:estudiante_id')
  @UseGuards(DocenteGuard)
  async findByEstudiante(@Param('estudiante_id') estudiante_id: string) {
    return await this.calificacionProyectoService.findByEstudiante(estudiante_id);
  }

  // 🎓 TUTOR: Actualizar calificación
  @Patch(':id')
  @UseGuards(DocenteGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCalificacionProyectoDto,
    @Req() req
  ) {
    const docente_id = req.user.docente_id;
    return await this.calificacionProyectoService.update(
      id, 
      updateDto, 
      docente_id
    );
  }

  // 🎓 TUTOR + 👑 ADMIN: Eliminar calificación
  @Delete(':id')
  @UseGuards(DocenteGuard)
  async remove(@Param('id') id: string, @Req() req) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : undefined;
    return await this.calificacionProyectoService.remove(id, docente_id);
  }
}
