import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Role } from './entities/usuario.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) { }

  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @UseGuards(AdminGuard)
  @Post('/register')
  register(
    @Body() registerDto: RegisterDto) {
    return this.usuariosService.register(registerDto);
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

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
    update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
      return this.usuariosService.update(id, updateUsuarioDto);
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
}
