import { Controller, Post, Body, UseGuards, Request, Put, Patch, Delete, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocenteGuard } from '../auth/guards/docente.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { DocenteOrAdminGuard } from '../auth/guards/docente-or-admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  // 🎓 DOCENTE: Crear insumo
  @UseGuards(DocenteOrAdminGuard)
  @Post()
  create(@Body() createInsumoDto: CreateInsumoDto, @Request() req) {
    return this.insumosService.create(
      createInsumoDto,
      req.user.docente_id
    );
  }

  // 👑 ADMIN: Listar todos (solo debugging)
  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.insumosService.findAll();
  }

  // 🎓 DOCENTE: Listar insumos por materia_curso y trimestre
  @Get('materia-curso/:materia_curso_id/trimestre/:trimestre_id')
  findByMateriaCursoYTrimestre(
    @Param('materia_curso_id') materia_curso_id: string,
    @Param('trimestre_id') trimestre_id: string
  ) {
    return this.insumosService.findByMateriaCursoYTrimestre(materia_curso_id, trimestre_id);
  }

  // 🎓 DOCENTE: Estadísticas
  @Get('materia-curso/:materia_curso_id/trimestre/:trimestre_id/estadisticas')
  contarPorEstado(
    @Param('materia_curso_id') materia_curso_id: string,
    @Param('trimestre_id') trimestre_id: string
  ) {
    return this.insumosService.contarPorEstado(materia_curso_id, trimestre_id);
  }

  // 👑 ADMIN + 🎓 DOCENTE: Obtener uno
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.insumosService.findOne(id);
  }

  // 🎓 DOCENTE: Actualizar
  @UseGuards(DocenteOrAdminGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateInsumoDto: UpdateInsumoDto,
    @Request() req
  ) {
    return this.insumosService.update(id, updateInsumoDto, req.user.docente_id);
  }

  // 🎓 DOCENTE: Publicar
  @UseGuards(DocenteOrAdminGuard)
  @Patch(':id/publicar')
  publicar(@Param('id') id: string, @Request() req) {
    return this.insumosService.publicar(id, req.user.docente_id);
  }

  // 👑 ADMIN: Reactivar
  @UseGuards(AdminGuard)
  @Patch(':id/reactivar')
  reactivar(@Param('id') id: string) {
    return this.insumosService.reactivar(id);
  }

  // 🎓 DOCENTE: Eliminar
  @UseGuards(DocenteOrAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.insumosService.remove(id, req.user.docente_id);
  }
}