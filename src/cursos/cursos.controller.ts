import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cursos')
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  // 👑 ADMIN: Crear curso
  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createCursoDto: CreateCursoDto) {
    return this.cursosService.create(createCursoDto);
  }

  // 👑 ADMIN: Listar cursos del período activo
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.cursosService.findAll();
  }

  // 👑 ADMIN: Cursos por período específico
  @UseGuards(JwtAuthGuard)
  @Get('periodo/:id')
  findByPeriodo(@Param('id') id: string) {
    return this.cursosService.findByPeriodo(id);
  }

  // 👑 ADMIN: Cursos por nivel
  @UseGuards(JwtAuthGuard)
  @Get('nivel/:nivel')
  findByNivel(@Param('nivel') nivel: string) {
    return this.cursosService.findByNivel(nivel);
  }

  // 👑 ADMIN: Cursos especifico
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cursosService.findOne(id);
  }

  // 👑 ADMIN: Actualizar curso
  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateCursoDto: UpdateCursoDto) {
    return this.cursosService.update(id, updateCursoDto);
  }

  // 👑 ADMIN: Cambiar estado del curso (activo/inactivo)
  @UseGuards(AdminGuard)
  @Patch(':id/cambiar-estado')
  cambiarEstado(@Param('id') id: string) {
    return this.cursosService.cambiarEstado(id);
  }
}
