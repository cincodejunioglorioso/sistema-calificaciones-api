import { Controller, Get, Post, Body, Patch, Param, UseGuards, Put, Res, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { MatriculasService } from './matriculas.service';
import { CreateMatriculaDto } from './dto/create-matricula.dto';
import { UpdateMatriculaDto } from './dto/update-matricula.dto';
import { RegistroImportacionDto } from './dto/importacion-matricula.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocenteGuard } from '../auth/guards/docente.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocenteOrAdminGuard } from '../auth/guards/docente-or-admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('matriculas')
export class MatriculasController {
  constructor(private readonly matriculasService: MatriculasService) {}

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createMatriculaDto: CreateMatriculaDto) {
    return this.matriculasService.create(createMatriculaDto);
  }

  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.matriculasService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matriculasService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateMatriculaDto: UpdateMatriculaDto) {
    return this.matriculasService.update(id, updateMatriculaDto);
  }

  @UseGuards(DocenteOrAdminGuard)
  @Get('curso/:curso_id')
  findByCurso(@Param('curso_id') curso_id: string) {
    return this.matriculasService.findByCurso(curso_id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/retirar')
  remove(@Param('id') id: string, @Body('observaciones') observaciones?: string) {
    return this.matriculasService.remove(id, observaciones?? undefined);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/reactivar')
  async reactivar(@Param('id') id: string) {
    return await this.matriculasService.reactivar(id);
  }

  @UseGuards(AdminGuard)
  @Get('plantilla/descargar')
  async descargarPlantilla(@Res() res: Response) {
    const filePath = path.join(
      process.cwd(),
      'public',
      'templates',
      'plantilla-matriculas.xlsx'
    );

    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('Plantilla no encontrada');
    }   

    res.download(filePath, 'plantilla-matriculas.xlsx', (err) => {
      if (err) {
        throw new BadRequestException('Error al descargar la plantilla');
      }
    });
  }

  @UseGuards(AdminGuard)
  @Post('importar/preview')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, callback) => {

      const allowedMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];

      if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(
          new BadRequestException('Solo se permiten archivos Excel'), false
        );
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
    }
  }))

  async previsualizarImportacion(
    @UploadedFile() file: Express.Multer.File,
    @Body('periodo_id') periodoId:string
  ) {

    if (!file) {
      throw new BadRequestException('Archivo no proporcionado');
    }

    if (!periodoId) {
      throw new BadRequestException('El periodo_id es obligatorio');
    }

    return this.matriculasService.procesarArchivoImportacion(file, periodoId);
  }

  @UseGuards(AdminGuard)
  @Post('importar/confirmar')
  async confirmarImportacion(
    @Body() body: {
      preview_id: string;
      periodo_id: string;
    }
  ) {
    if (!body.preview_id) {
      throw new BadRequestException('No hay registros para importar');
    }

    if (!body.periodo_id) {
      throw new BadRequestException('El periodo_id es obligatorio');
    }

    return this.matriculasService.confirmarImportacion(body.preview_id, body.periodo_id);
  }
}
