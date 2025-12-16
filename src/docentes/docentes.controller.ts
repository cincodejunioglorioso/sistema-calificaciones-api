import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put } from '@nestjs/common';
import { DocentesService } from './docentes.service';
import { CompletarPerfilDto } from './dto/completar-perfil.dto';
import { UpdateDocenteDto } from './dto/update-docente.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('docentes')
export class DocentesController {
  constructor(private readonly docentesService: DocentesService) {}

  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.docentesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('mi-perfil')
  findByUserId(@Request() req) {
    return this.docentesService.findByUserId(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('completar-perfil')
  completarPerfil(@Request() req, @Body() completarPerfilDto: CompletarPerfilDto) {
    return this.docentesService.completarPerfil(req.user.userId, completarPerfilDto);
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.docentesService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateDocenteDto: UpdateDocenteDto) {
    return this.docentesService.update(id, updateDocenteDto);
  }

}
