import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put, Req } from '@nestjs/common';
import { MateriaCursoService } from './materia-curso.service';
import { CreateMateriaCursoDto } from './dto/create-materia-curso.dto';
import { UpdateMateriaCursoDto } from './dto/update-materia-curso.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { DocenteGuard } from '../auth/guards/docente.guard';

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

  @UseGuards(DocenteGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.materiaCursoService.findOne(id, req.user.docente_id);
  }

  @UseGuards(AdminGuard)
  @Get('curso/:curso_id')
  findByCurso(@Param('curso_id') curso_id: string) {
    return this.materiaCursoService.findByCurso(curso_id);
  }

  @UseGuards(DocenteGuard)
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
