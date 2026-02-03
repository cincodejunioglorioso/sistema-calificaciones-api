import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { EstadoEstudiante } from './entities/estudiante.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TutorGuard } from '../auth/guards/tutor.guard';
import { UpdateDatosPersonalesDto } from './dto/update-datos-personales.dto';

@UseGuards(JwtAuthGuard)
@Controller('estudiantes')
export class EstudiantesController {
  constructor(private readonly estudiantesService: EstudiantesService) {}

  // 📊 Estadísticas (debe ir ANTES de :id para evitar conflictos de rutas)
  @UseGuards(AdminGuard)
  @Get('estadisticas')
  getEstadisticas() {
    return this.estudiantesService.getEstadisticas();
  }

  // 🔍 Incompletos (debe ir ANTES de :id)
  @UseGuards(AdminGuard)
  @Get('incompletos')
  findIncompletos(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.estudiantesService.findIncompletos(+page, +limit);
  }

  // 📋 Listar todos
  @UseGuards(AdminGuard)
  @Get()
  findAll(
    @Query('estado') estado: EstadoEstudiante,
    @Query('incompletos') incompletos?: string,
    @Query('search') search?: string,
    @Query('nivelCurso') nivelCurso?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const mostrarIncompletos = incompletos === 'true' ? true : incompletos === 'false' ? false : undefined;

    return this.estudiantesService.findAll(
      estado,
      mostrarIncompletos,
      search,
      nivelCurso,
      +page,
      +limit,
    );
  }

  // 👤 Obtener uno por ID
  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.estudiantesService.findOne(id);
  }

  // ✏️ Actualizar estudiante (admin)
  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateEstudianteDto: UpdateEstudianteDto) {
    return this.estudiantesService.update(id, updateEstudianteDto);
  }

  // ✏️ Actualizar datos personales (tutor)
  @UseGuards(TutorGuard)
  @Put(':id/datos-personales')
  actualizarDatosPersonales(
    @Param('id') id: string,
    @Body() updateDatosPersonalesDto: UpdateDatosPersonalesDto,
  ) {
    return this.estudiantesService.actualizarDatosPersonales(id, updateDatosPersonalesDto);
  }

  // ❌ Retirar estudiante
  @UseGuards(AdminGuard)
  @Patch(':id/retirar')
  retirar(@Param('id') id: string, @Body('motivo') motivo?: string) {
    return this.estudiantesService.retirar(id, motivo);
  }

  // 🎓 Graduar estudiante
  @UseGuards(AdminGuard)
  @Patch(':id/graduar')
  graduar(@Param('id') id: string) {
    return this.estudiantesService.graduar(id);
  }

  // 🔄 Reactivar estudiante
  @UseGuards(AdminGuard)
  @Patch(':id/reactivar')
  reactivar(@Param('id') id: string) {
    return this.estudiantesService.reactivar(id);
  }
}