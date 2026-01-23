import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CalificacionInsumoService } from './calificacion_insumo.service';
import { CreateCalificacionInsumoDto } from './dto/create-calificacion_insumo.dto';
import { UpdateCalificacionInsumoDto } from './dto/update-calificacion_insumo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocenteGuard } from '../auth/guards/docente.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Role } from '../usuarios/entities/usuario.entity';
import { DocenteOrAdminGuard } from '../auth/guards/docente-or-admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('calificacion-insumo')
export class CalificacionInsumoController {
  constructor(private readonly calificacionInsumoService: CalificacionInsumoService) {}

  // 🎓 DOCENTE: Crear calificación (individual o batch)
  @Post()
  @UseGuards(DocenteOrAdminGuard)
  async create(
    @Body() createCalificacionInsumoDto: CreateCalificacionInsumoDto,
    @Req() req
  ) {
    return await this.calificacionInsumoService.create(createCalificacionInsumoDto, req.user.docente_id);
  }

  // 👑 ADMIN: Listar todas las calificaciones
  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return await this.calificacionInsumoService.findAll();
  }

  // 👑 ADMIN + 🎓 DOCENTE: Obtener calificación por ID
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : undefined;
    return await this.calificacionInsumoService.findOne(id, docente_id);
  }

  // 👑 ADMIN + 🎓 DOCENTE: Listar calificaciones de un insumo  
  @Get('insumo/:insumo_id')
  @UseGuards(DocenteOrAdminGuard)
  async findByInsumo(
    @Param('insumo_id') insumo_id: string,
    @Req() req
  ) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : null;
    return await this.calificacionInsumoService.findByInsumo(insumo_id, docente_id);
  }

  // 👑 ADMIN + 🎓 DOCENTE: Calcular promedio de un insumo
  @Get('insumo/:insumo_id/promedio')
  async calcularPromedio(@Param('insumo_id') insumo_id: string) {
    const promedio = await this.calificacionInsumoService.calcularPromedioInsumo(insumo_id);
    return {
      insumo_id,
      promedio
    };
  }  

  // 👑 ADMIN + 🎓 DOCENTE: Listar estudiantes sin calificar
  @Get('insumo/:insumo_id/sin-calificar')
  async estudiantesSinCalificar(
    @Param('insumo_id') insumo_id: string,
    @Req() req
  ) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : null;
    return await this.calificacionInsumoService.estudiantesSinCalificar(
      insumo_id, 
      docente_id
    );
  }

  // 👑 ADMIN + 🎓 DOCENTE: Listar calificaciones de un estudiante
  @Get('estudiante/:estudiante_id')
  async findByEstudiante(@Param('estudiante_id') estudiante_id: string) {
    return await this.calificacionInsumoService.findByEstudiante(estudiante_id);
  }

  // 🎓 DOCENTE: Actualizar calificación (solo en estado ACTIVO)
  @Patch(':id')
  @UseGuards(DocenteOrAdminGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCalificacionInsumoDto,
    @Req() req
  ) {
    return await this.calificacionInsumoService.update(
      id, 
      updateDto, 
      req.user.docente_id
    );
  }

// 👑 ADMIN: Eliminar calificación (solo debugging)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : undefined;
    return await this.calificacionInsumoService.remove(id, docente_id);
  }
}