import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { Role } from './entities/usuario.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) { }

  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/cambiar-estado')
  cambiarEstado(@Param('id') id: string) {
    return this.usuariosService.cambiarEstado(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/cambiar-rol')
  cambiarRol(@Param('id') id: string, @Body() { rol }: { rol: Role }) {
    return this.usuariosService.cambiarRol(id, rol);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() resetPasswordDto: ResetPasswordDto) {
    return this.usuariosService.resetPassword(id, resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('cambiar-password')
  cambiarMiPassword(
    @Request() req,
    @Body() cambiarPasswordDto: CambiarPasswordDto
  ) {
    const userId = req.user.userId;
    return this.usuariosService.cambiarMiPassword(
      userId,
      cambiarPasswordDto
    );
  }

}
