// nest-backend/src/promedio-periodo/promedio-periodo.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { PromedioPeriodoService } from './promedio-periodo.service';
import { CreatePromedioPeriodoDto } from './dto/create-promedio-periodo.dto';
import { UpdatePromedioPeriodoDto } from './dto/update-promedio-periodo.dto';
import { RegistrarSupletorioDto } from './dto/registrar-supletorio.dto';
import { GenerarPromediosPeriodoMasivoDto } from './dto/generar-promedios-masivo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { DocenteGuard } from '../auth/guards/docente.guard';
import { DocenteOrAdminGuard } from '../auth/guards/docente-or-admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('promedio-periodo')
export class PromedioPeriodoController {
  constructor(private readonly promedioPeriodoService: PromedioPeriodoService) {}

  /**
   * 👑 ADMIN: Crear promedio anual individual (manual excepcional)
   */
  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() createDto: CreatePromedioPeriodoDto) {
    return await this.promedioPeriodoService.create(createDto);
  }

  /**
   * 👑 ADMIN: Generar promedios anuales masivos para todo un período
   * Se ejecuta automáticamente al finalizar período lectivo
   */
  @Post('generar-masivo')
  @UseGuards(AdminGuard)
  async generarPromediosMasivo(@Body() dto: GenerarPromediosPeriodoMasivoDto) {
    return await this.promedioPeriodoService.generarPromediosMasivo(dto.periodo_lectivo_id);
  }

  /**
   * 🎓 DOCENTE: Registrar nota de supletorio
   * Solo el docente de la materia puede registrar
   */
  @Patch(':id/registrar-supletorio')
  @UseGuards(DocenteOrAdminGuard)
  async registrarSupletorio(
    @Param('id') id: string,
    @Body() dto: RegistrarSupletorioDto,
    @Request() req
  ) {
    return await this.promedioPeriodoService.registrarSupletorio(id, dto, req.user.docente_id);
  }

  /**
   * 👑 ADMIN: Listar todos los promedios anuales
   */
  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return await this.promedioPeriodoService.findAll();
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Estudiantes en supletorio por materia-curso
   */
  @Get('supletorio/materia-curso/:materia_curso_id/periodo/:periodo_lectivo_id')
  @UseGuards(DocenteOrAdminGuard)
  async estudiantesEnSupletorio(
    @Param('materia_curso_id') materia_curso_id: string,
    @Param('periodo_lectivo_id') periodo_lectivo_id: string
  ) {
    return await this.promedioPeriodoService.estudiantesEnSupletorio(materia_curso_id, periodo_lectivo_id);
  }

  /**
   * 🎓 TUTOR + 👑 ADMIN: Todos los estudiantes en supletorio de un período
   */
  @Get('supletorio/periodo/:periodo_lectivo_id')
  @UseGuards(DocenteOrAdminGuard)
  async todosEstudiantesEnSupletorio(@Param('periodo_lectivo_id') periodo_lectivo_id: string) {
    return await this.promedioPeriodoService.todosEstudiantesEnSupletorioPorPeriodo(periodo_lectivo_id);
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Promedios anuales por materia-curso y período
   */
  @Get('materia-curso/:materia_curso_id/periodo/:periodo_lectivo_id')
  @UseGuards(DocenteOrAdminGuard)
  async findByMateriaCursoYPeriodo(
    @Param('materia_curso_id') materia_curso_id: string,
    @Param('periodo_lectivo_id') periodo_lectivo_id: string
  ) {
    return await this.promedioPeriodoService.findByMateriaCursoYPeriodo(materia_curso_id, periodo_lectivo_id);
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Promedios anuales por curso y período
   */
  @Get('curso/:curso_id/periodo/:periodo_lectivo_id')
  @UseGuards(DocenteOrAdminGuard)
  async findByCursoYPeriodo(
    @Param('curso_id') curso_id: string,
    @Param('periodo_lectivo_id') periodo_lectivo_id: string
  ) {
    return await this.promedioPeriodoService.findByCursoYPeriodo(curso_id, periodo_lectivo_id);
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Histórico de promedios anuales de un estudiante
   */
  @Get('estudiante/:estudiante_id')
  @UseGuards(DocenteOrAdminGuard)
  async findByEstudiante(@Param('estudiante_id') estudiante_id: string) {
    return await this.promedioPeriodoService.findByEstudiante(estudiante_id);
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Obtener promedio anual específico
   */
  @Get(':id')
  @UseGuards(DocenteOrAdminGuard)
  async findOne(@Param('id') id: string) {
    return await this.promedioPeriodoService.findOne(id);
  }

  /**
   * 👑 ADMIN: Actualizar observaciones
   */
  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(@Param('id') id: string, @Body() updateDto: UpdatePromedioPeriodoDto) {
    return await this.promedioPeriodoService.update(id, updateDto);
  }

  /**
   * 👑 ADMIN: Recalcular promedio anual
   */
  @Patch(':id/recalcular')
  @UseGuards(AdminGuard)
  async recalcular(@Param('id') id: string) {
    return await this.promedioPeriodoService.recalcular(id);
  }

  /**
   * 👑 ADMIN: Eliminar promedio anual
   */
  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(@Param('id') id: string) {
    return await this.promedioPeriodoService.remove(id);
  }
}