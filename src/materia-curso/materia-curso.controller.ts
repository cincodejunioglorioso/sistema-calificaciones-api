import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { MateriaCursoService } from './materia-curso.service';
import { CreateMateriaCursoDto } from './dto/create-materia-curso.dto';
import { UpdateMateriaCursoDto } from './dto/update-materia-curso.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('materia-curso')
@UseGuards(JwtAuthGuard)
export class MateriaCursoController {
  constructor(private readonly materiaCursoService: MateriaCursoService) {}

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createMateriaCursoDto: CreateMateriaCursoDto) {
    return this.materiaCursoService.create(createMateriaCursoDto);
  }

  @UseGuards(AdminGuard) 
  @Get()
  findAll() {
    return this.materiaCursoService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materiaCursoService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Get('curso/:curso_id')
  findByCurso(@Param('curso_id') curso_id: string) {
    return this.materiaCursoService.findByCurso(curso_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('docente/:docente_id')
  findByDocente(@Param('docente_id') docente_id: string) {
    return this.materiaCursoService.findByDocente(docente_id);
  }

  @UseGuards(AdminGuard)
  @Get('materia/:materia_id')
  findByMateria(@Param('materia_id') materia_id: string) {
    return this.materiaCursoService.findByMateria(materia_id);
  }

  @UseGuards(AdminGuard)
  @Get('periodo-lectivo/:periodo_lectivo_id')
  findByPeriodoLectivo(@Param('periodo_lectivo_id') periodo_lectivo_id: string) {
    return this.materiaCursoService.findByPeriodoLectivo(periodo_lectivo_id);
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateMateriaCursoDto: UpdateMateriaCursoDto) {
    return this.materiaCursoService.update(id, updateMateriaCursoDto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.materiaCursoService.remove(id);
  }
}
