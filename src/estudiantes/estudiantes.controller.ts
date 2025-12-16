import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { EstudiantesService } from './estudiantes.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { EstadoEstudiante } from './entities/estudiante.entity';

@Controller('estudiantes')
export class EstudiantesController {
  constructor(private readonly estudiantesService: EstudiantesService) {}

  @UseGuards(AdminGuard)
  @Get()
  findAll(
    @Query('estado') estado: EstadoEstudiante,
    @Query('incompletos') incompletos?: string,
    @Query('search') search?: string,
    @Query('cursoId') cursoId?: string,
    @Query('nivelCurso') nivelCurso?: string,
    @Query('periodoId') periodoId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {

    console.log('📥 Parámetros recibidos:', { estado, cursoId, nivelCurso, periodoId, incompletos, search });
    const mostrarIncompletos = incompletos === 'true' ? true : incompletos === 'false' ? false : undefined;

    return this.estudiantesService.findAll(
      estado,
      mostrarIncompletos,
      search,
      cursoId,
      nivelCurso,
      periodoId,
      +page,
      +limit,
    );    
  } 

  @UseGuards(AdminGuard)
  @Get('incompletos')
  findIncompletos(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.estudiantesService.findIncompletos(+page, +limit);
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.estudiantesService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateEstudianteDto: UpdateEstudianteDto) {
    return this.estudiantesService.update(id, updateEstudianteDto);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/retirar')
  retirar(@Param('id') id: string, @Body('motivo') motivo?: string) {
    return this.estudiantesService.retirar(id, motivo);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/graduar')
  graduar(@Param('id') id: string) {
    return this.estudiantesService.graduar(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/reactivar')
  reactivar(@Param('id') id: string) {
    return this.estudiantesService.reactivar(id);
  }
}
