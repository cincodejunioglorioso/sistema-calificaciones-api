import { Controller, Get, Post, Body, Patch, Param, UseGuards, Put } from '@nestjs/common';
import { PeriodosLectivosService } from './periodos-lectivos.service';
import { CreatePeriodoLectivoDto } from './dto/create-periodos-lectivo.dto';
import { UpdatePeriodoLectivoDto } from './dto/update-periodos-lectivo.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrimestresService } from '../trimestres/trimestres.service';

@Controller('periodos-lectivos')
@UseGuards(JwtAuthGuard)
export class PeriodosLectivosController {
  constructor(
    private readonly periodosLectivosService: PeriodosLectivosService,
    private readonly trimestresService: TrimestresService
  ) {}

  // 👑 ADMIN: Crear período lectivo
  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createPeriodoLectivoDto: CreatePeriodoLectivoDto) {
    return this.periodosLectivosService.create(createPeriodoLectivoDto);
  }

  // 👑 ADMIN: Listar períodos
  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.periodosLectivosService.findAll();
  }
  
  // 👑 ADMIN + 🎓 DOCENTE: Período activo
  @Get('/periodo-activo')
  findActivo() {
    return this.periodosLectivosService.findActivo();
  }

  // 👑 ADMIN: Ver trimestres de un período específico
  @UseGuards(AdminGuard)
  @Get(':id/trimestres')
  getTrimestresPeriodo(@Param('id') id: string) {
    return this.trimestresService.findTrimestresByPeriodo(id);
  }

  // 👑 ADMIN: Período específico
  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.periodosLectivosService.findOne(id);
  }

  // 👑 ADMIN: Actualizar período (menos estado)
  @UseGuards(AdminGuard)
  @Put(':id')
  update(
    @Param('id') id: string, 
    @Body() updatePeriodoLectivoDto: UpdatePeriodoLectivoDto
  ) {
    return this.periodosLectivosService.update(id, updatePeriodoLectivoDto);
  }

  // 👑 ADMIN: Validar cierre de período
  @UseGuards(AdminGuard)
  @Post(':id/validar-cierre')
  async validarCierre(@Param('id') id: string) {
    return await this.periodosLectivosService.validarCierrePeriodo(id);
  }

  // 👑 ADMIN: Finalizar período lectivo (IRREVERSIBLE)
  @UseGuards(AdminGuard)
  @Patch(':id/cambiar-estado')
  cambiarEstado(@Param('id') id: string) {
    return this.periodosLectivosService.cambiarEstado(id);
  }
}
