import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { TiposEvaluacionService } from './tipos-evaluacion.service';
import { CreateTipoEvaluacionDto } from './dto/create-tipos-evaluacion.dto';
import { UpdateTipoEvaluacionDto } from './dto/update-tipos-evaluacion.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tipos-evaluacion')
export class TiposEvaluacionController {
  constructor(private readonly tiposEvaluacionService: TiposEvaluacionService) { }

  // 👑 ADMIN: Crear tipo individual (usado internamente)
  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createTipoEvaluacionDto: CreateTipoEvaluacionDto) {
    return this.tiposEvaluacionService.create(createTipoEvaluacionDto);
  }

  // 👑 ADMIN: Crear los 3 tipos de una vez (usado en wizard Fase 4)
  @UseGuards(AdminGuard)
  @Post('batch/:periodo_id')
  createBatch(
    @Param('periodo_id') periodo_id: string,
    @Body() porcentajes: { insumos: number; proyecto: number; examen: number }
  ) {
    return this.tiposEvaluacionService.createBatch(periodo_id, porcentajes);
  }

  @UseGuards(AdminGuard)
  @Put('batch/:periodo_id')
  updateBatch(
    @Param('periodo_id') periodo_id: string,
    @Body() porcentajes: { insumos: number; proyecto: number; examen: number }
  ) {
    return this.tiposEvaluacionService.updateBatch(periodo_id, porcentajes);
  }

  @UseGuards(JwtAuthGuard)
  @Get('periodo/:periodo_id/verificar-promedios')
  verificarPromedios(@Param('periodo_id') periodo_id: string) {
    return this.tiposEvaluacionService.verificarPromediosGenerados(periodo_id);
  }

  // 👑 ADMIN: Listar todos los tipos
  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.tiposEvaluacionService.findAll();
  }

  // 👑 ADMIN + 🎓 DOCENTE: Tipos de evaluación de un período específico
  @UseGuards(JwtAuthGuard)
  @Get('periodo/:periodo_id')
  findByPeriodo(@Param('periodo_id') periodo_id: string) {
    return this.tiposEvaluacionService.findByPeriodo(periodo_id);
  }

  // 👑 ADMIN: Obtener tipo específico
  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tiposEvaluacionService.findOne(id);
  }

  // 👑 ADMIN: Actualizar porcentaje de un tipo
  @UseGuards(AdminGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTipoEvaluacionDto: UpdateTipoEvaluacionDto
  ) {
    return this.tiposEvaluacionService.update(id, updateTipoEvaluacionDto);
  }
}