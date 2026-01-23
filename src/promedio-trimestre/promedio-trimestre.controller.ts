// promedio-trimestre.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PromedioTrimestreService } from './promedio-trimestre.service';
import { CreatePromedioTrimestreDto } from './dto/create-promedio-trimestre.dto';
import { UpdatePromedioTrimestreDto } from './dto/update-promedio-trimestre.dto';
import { GenerarPromediosMasivoDto } from './dto/generar-promedios-masivo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { DocenteGuard } from '../auth/guards/docente.guard';
import { DocenteOrAdminGuard } from '../auth/guards/docente-or-admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('promedio-trimestre')
export class PromedioTrimestreController {
  constructor(private readonly promedioTrimestreService: PromedioTrimestreService) {}

  /**
   * 👑 ADMIN: Crear promedio individual (manual excepcional)
   */
  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() createPromedioTrimestreDto: CreatePromedioTrimestreDto) {
    return await this.promedioTrimestreService.create(createPromedioTrimestreDto);
  }

  //👑 ADMIN: Generar promedios masivos para todo un trimestre, Se ejecuta automáticamente al cerrar trimestre desde TrimestreService  
  @Post('generar-masivo')
  @UseGuards(AdminGuard)
  async generarPromediosMasivo(@Body() dto: GenerarPromediosMasivoDto) {
    return await this.promedioTrimestreService.generarPromediosMasivo(dto.trimestre_id);
  }

  /**
   * 👑 ADMIN: Listar todos los promedios
   */
  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return await this.promedioTrimestreService.findAll();
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Listar promedios por materia-curso y trimestre
   */
  @Get('materia-curso/:materia_curso_id/trimestre/:trimestre_id')
  @UseGuards(DocenteOrAdminGuard)
  async findByMateriaCursoYTrimestre(
    @Param('materia_curso_id') materia_curso_id: string,
    @Param('trimestre_id') trimestre_id: string
  ) {
    return await this.promedioTrimestreService.findByMateriaCursoYTrimestre(materia_curso_id, trimestre_id);
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Listar promedios por curso y trimestre
   */
  @Get('curso/:curso_id/trimestre/:trimestre_id')
  @UseGuards(DocenteOrAdminGuard)
  async findByCursoYTrimestre(
    @Param('curso_id') curso_id: string,
    @Param('trimestre_id') trimestre_id: string
  ) {
    return await this.promedioTrimestreService.findByCursoYTrimestre(curso_id, trimestre_id);
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Listar promedios de un estudiante (histórico)
   */
  @Get('estudiante/:estudiante_id')
  @UseGuards(DocenteOrAdminGuard)
  async findByEstudiante(@Param('estudiante_id') estudiante_id: string) {
    return await this.promedioTrimestreService.findByEstudiante(estudiante_id);
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Obtener promedio específico
   */
  @Get(':id')
  @UseGuards(DocenteOrAdminGuard)
  async findOne(@Param('id') id: string) {
    return await this.promedioTrimestreService.findOne(id);
  }

  /**
   * 👑 ADMIN: Actualizar observaciones de un promedio
   */
  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(@Param('id') id: string, @Body() updatePromedioTrimestreDto: UpdatePromedioTrimestreDto) {
    return await this.promedioTrimestreService.update(id, updatePromedioTrimestreDto);
  }

  /**
   * 👑 ADMIN: Recalcular un promedio (eliminar + crear con datos actuales)
   */
  @Patch(':id/recalcular')
  @UseGuards(AdminGuard)
  async recalcular(@Param('id') id: string) {
    return await this.promedioTrimestreService.recalcular(id);
  }

  /**
   * 👑 ADMIN: Eliminar promedio (para recalcular después)
   */
  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(@Param('id') id: string) {
    return await this.promedioTrimestreService.remove(id);
  }
}