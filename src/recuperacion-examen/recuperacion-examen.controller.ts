import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { RecuperacionExamenService } from './recuperacion-examen.service';
import { CreateRecuperacionExamenDto } from './dto/create-recuperacion-examen.dto';
import { UpdateRecuperacionExamenDto } from './dto/update-recuperacion-examen.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocenteGuard } from '../auth/guards/docente.guard';
import { DocenteOrAdminGuard } from '../auth/guards/docente-or-admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('recuperacion-examen')
export class RecuperacionExamenController {
  constructor(private readonly recuperacionExamenService: RecuperacionExamenService) {}

  // 🎓 DOCENTE: Crear/Actualizar recuperación
  @Post()
  @UseGuards(DocenteGuard)
  create(@Body() createDto: CreateRecuperacionExamenDto, @Req() req: any) {
    return this.recuperacionExamenService.create(createDto, req.user.docente_id);
  }

  // 🎓 DOCENTE + 👑 ADMIN: Obtener recuperación por calificación
  @Get('calificacion/:calificacion_examen_id')
  @UseGuards(DocenteOrAdminGuard)
  findByCalificacion(
    @Param('calificacion_examen_id') calificacion_examen_id: string,
    @Query('admin') isAdmin: string,
    @Req() req
  ) {
    const docente_id = isAdmin === 'true' ? undefined : req.user.docente_id;
    return this.recuperacionExamenService.findByCalificacion(calificacion_examen_id, docente_id);
  }

  // 🎓 DOCENTE: Actualizar recuperación
  @Patch(':id')
  @UseGuards(DocenteGuard)
  update(@Param('id') id: string, @Body() updateDto: UpdateRecuperacionExamenDto, @Req() req: any) {
    return this.recuperacionExamenService.update(id, updateDto, req.user.docente_id);
  }

  // 🎓 DOCENTE + 👑 ADMIN: Eliminar recuperación
  @Delete(':id')
  @UseGuards(DocenteGuard)
  remove(@Param('id') id: string, @Query('admin') isAdmin: string, @Req() req: any) {
    const docente_id = isAdmin === 'true' ? undefined : req.user.docente_id;
    return this.recuperacionExamenService.remove(id, docente_id);
  }
}