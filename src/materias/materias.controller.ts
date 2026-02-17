import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { MateriasService } from './materias.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocenteOrAdminGuard } from '../auth/guards/docente-or-admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('materias')
export class MateriasController {
  constructor(private readonly materiasService: MateriasService) {}

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createMateriaDto: CreateMateriaDto) {
    return this.materiasService.create(createMateriaDto);
  }

  @UseGuards(DocenteOrAdminGuard)
  @Get()
  findAll() {
    return this.materiasService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materiasService.findOne(id);
  }

  // 🆕 Verificar implicaciones de edición
  @UseGuards(AdminGuard)
  @Post(':id/verificar-edicion')
  verificarEdicion(@Param('id') id: string, @Body() updateMateriaDto: UpdateMateriaDto) {
    return this.materiasService.verificarImplicacionesEdicion(id, updateMateriaDto);
  }

  // 🆕 Verificar asignaciones activas (para desactivar)
  @UseGuards(AdminGuard)
  @Get(':id/verificar-asignaciones')
  verificarAsignaciones(@Param('id') id: string) {
    return this.materiasService.verificarAsignacionesActivas(id);
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateMateriaDto: UpdateMateriaDto) {
    return this.materiasService.update(id, updateMateriaDto);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/cambiar-estado')
  remove(@Param('id') id: string) {
    return this.materiasService.remove(id);
  }
}