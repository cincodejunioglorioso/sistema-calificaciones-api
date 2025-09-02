import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { MateriasService } from './materias.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('materias')
export class MateriasController {
  constructor(private readonly materiasService: MateriasService) {}

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createMateriaDto: CreateMateriaDto) {
    return this.materiasService.create(createMateriaDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.materiasService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materiasService.findOne(id);
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
