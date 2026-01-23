import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { RecuperacionInsumoService } from './recuperacion_insumo.service';
import { CreateRecuperacionInsumoDto } from './dto/create-recuperacion_insumo.dto';
import { UpdateRecuperacionInsumoDto } from './dto/update-recuperacion_insumo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocenteGuard } from '../auth/guards/docente.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Role } from '../usuarios/entities/usuario.entity';

@UseGuards(JwtAuthGuard)
@Controller('recuperacion-insumo')
export class RecuperacionInsumoController {
  constructor(private readonly recuperacionInsumoService: RecuperacionInsumoService) {}

  @Post()
  @UseGuards(DocenteGuard)
  async create(
    @Body() createRecuperacionInsumoDto: CreateRecuperacionInsumoDto,
    @Req() req
  ) {
    return await this.recuperacionInsumoService.create(createRecuperacionInsumoDto, req.user.docente_id);
  }

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return await this.recuperacionInsumoService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req
  ) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : undefined;
    return await this.recuperacionInsumoService.findOne(id, docente_id);
  }

  // 👑 ADMIN + 🎓 DOCENTE: Historial de recuperaciones por calificación
  @Get('calificacion/:calificacion_insumo_id')
  async findByCalificacion(
    @Param('calificacion_insumo_id') calificacion_insumo_id: string,
    @Req() req
  ) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : undefined;
    return await this.recuperacionInsumoService.findByCalificacion(
      calificacion_insumo_id,
      docente_id
    );
  }

  // 👑 ADMIN + 🎓 DOCENTE: Recuperaciones por insumo
  @Get('insumo/:insumo_id')
  async findByInsumo(
    @Param('insumo_id') insumo_id: string,
    @Req() req
  ) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : undefined;
    return await this.recuperacionInsumoService.findByInsumo(
      insumo_id,
      docente_id
    );
  }

  // 🎓 DOCENTE: Actualizar recuperación (solo en estado ACTIVO)
  @Patch(':id')
  @UseGuards(DocenteGuard)
  async update(
    @Param('id') id: string,
    @Body() updateRecuperacionInsumoDto: UpdateRecuperacionInsumoDto,
    @Req() req
  ) {
    return await this.recuperacionInsumoService.update(
      id,
      updateRecuperacionInsumoDto,
      req.user.docente_id
    );
  }

  // 🎓 DOCENTE + 👑 ADMIN: Eliminar recuperación
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    const docente_id = req.user.rol === Role.DOCENTE ? req.user.docente_id : undefined;
    return await this.recuperacionInsumoService.remove(id, docente_id);
  }
}
