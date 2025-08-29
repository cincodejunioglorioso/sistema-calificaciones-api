// usuarios/usuarios.service.ts
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario, Status, Role } from './entities/usuario.entity';
import * as bcrypt from 'bcrypt';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) { }

  // 👑 ADMIN: Listar todos los usuarios
  async findAll() {
    return await this.usuarioRepository.find({
      select: ['id', 'email', 'rol', 'estado', 'createdAt'],
      order: { createdAt: 'DESC' },
      where: {
        estado: Status.ACTIVE
      }
    });
  }

  // 👑 ADMIN: Obtener usuario específico
  async findOne(id: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      select: ['id', 'email', 'rol', 'estado', 'createdAt', 'updatedAt']
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  // 👑 ADMIN: Cambiar estado de cualquier usuario
  async cambiarEstado(id: string) {
    const usuario = await this.findOne(id);

    const nuevoEstado = usuario.estado === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE;

    await this.usuarioRepository.update(id, { estado: nuevoEstado });

    return {
      message: `Usuario ${nuevoEstado === Status.ACTIVE ? 'activado' : 'desactivado'} exitosamente`,
    };
  }

  // 👑 ADMIN: Cambiar rol de usuario
  async cambiarRol(id: string, nuevoRol: Role) {
    const usuario = await this.findOne(id);

    await this.usuarioRepository.update(id, { rol: nuevoRol });

    return {
      message: 'Rol actualizado exitosamente',
      usuario: {
        id: usuario.id,
        email: usuario.email
      },
      rol_anterior: usuario.rol,
      rol_nuevo: nuevoRol
    };
  }

  // 👤 USUARIO: Cambiar MI propia contraseña
  async cambiarMiPassword(userId: string, cambiarPasswordDto: CambiarPasswordDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'password_hash']
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    //Validar contraseña actual
    const esPasswordValida = await bcrypt.compare(cambiarPasswordDto.oldPassword, usuario.password_hash);
    if (!esPasswordValida) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(cambiarPasswordDto.newPassword, 10);

    await this.usuarioRepository.update(userId, {
      password_hash: hashedPassword
    });

    return {
      message: 'Tu contraseña ha sido actualizada exitosamente',
      usuario: {
        id: usuario.id,
        email: usuario.email
      }
    };
  }

  // 👑 ADMIN: Cambiar contraseña de cualquier usuario
  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id }
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // El admin no necesita conocer la contraseña actual
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.usuarioRepository.update(id, {
      password_hash: hashedPassword
    });

    return {
      message: 'Contraseña restablecida exitosamente',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      }
    };
  }


}