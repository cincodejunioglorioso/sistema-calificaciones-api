import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { TrimestresService } from './trimestres.service';
import { CreateTrimestreDto } from './dto/create-trimestre.dto';
import { UpdateTrimestreDto } from './dto/update-trimestre.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocenteGuard } from '../auth/guards/docente.guard';

@Controller('trimestres')
@UseGuards(JwtAuthGuard)
export class TrimestresController {
  constructor(private readonly trimestresService: TrimestresService) {}

  // 🌍 ADMIN + DOCENTE: Trimestres del período actual
  @UseGuards(JwtAuthGuard)
  @Get('periodo-activo')
  findTrimestrePeriodoActual() {
    return this.trimestresService.findTrimestresPeriodoActual();
  }

  // 🌍 ADMIN + DOCENTE: Trimestre activo actual
  @UseGuards(JwtAuthGuard)
  @Get('activo')
  findTrimestreActivo() {
    return this.trimestresService.findTrimestreActivo();
  }

  // 👑 ADMIN: Ver trimestres de un período específico
  @UseGuards(JwtAuthGuard)
  @Get('periodo/:periodoId')
  findTrimestresByPeriodo(@Param('periodoId') periodoId: string) {
    return this.trimestresService.findTrimestresByPeriodo(periodoId);
  }

  // 👑 ADMIN: Obtener trimestre específico
  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trimestresService.findOne(id);
  }  

  // 👑 ADMIN: Actualizar trimestre (cambiar fechas)
  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateTrimestreDto: UpdateTrimestreDto) {
    return this.trimestresService.update(id, updateTrimestreDto);
  }

  // 👑 ADMIN: Validar si se puede cerrar un trimestre
  @UseGuards(AdminGuard)
  @Post(':id/validar-cierre')
  async validarCierre(@Param('id') id: string) {
    return await this.trimestresService.validarCierreTrimestre(id);
  }
}
