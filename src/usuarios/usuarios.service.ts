// usuarios/usuarios.service.ts
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Usuario, Role, Estado } from './entities/usuario.entity';
import { Docente, NivelAsignado } from '../docentes/entities/docente.entity';
import { RegisterDto } from './dto/register.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcryptjs';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';


@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Docente)
    private docenteRepository: Repository<Docente>,
    private datasource: DataSource,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, password, rol, nombres, apellidos, cedula, telefono, nivel_asignado: nivel } = registerDto;

    const existingUser = await this.usuarioRepository.findOne(
      {
        where: { email }
      }
    );

    if (existingUser) {
      throw new ConflictException('El email ya se encuentra en uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.datasource.transaction(async manager => {
      const usuario = manager.create(Usuario, {
        email,
        password_hash: hashedPassword,
        rol: rol || Role.DOCENTE
      });

      const savedUser = await manager.save(usuario);
      let savedDocente: Docente | null = null;

      const nivelAsignar = savedUser.rol === Role.SECRETARIA
        ? NivelAsignado.GLOBAL
        : nivel;

      const docente = manager.create(Docente, {
        nombres,
        apellidos,
        cedula,
        telefono,
        nivelAsignado: nivelAsignar,
        usuario_id: savedUser,
        perfil_completo: false
      });

      savedDocente = await manager.save(docente);

      const { password_hash: _, ...userWithoutPassword } = savedUser;

      return {
        message: `Usuario ${savedUser.rol} creado exitosamente`,
        usuario: userWithoutPassword,
        ...(savedDocente && {
          docente: {
            id: savedDocente.id,
            nombres: savedDocente.nombres,
            apellidos: savedDocente.apellidos,
            cedula: savedDocente.cedula,
            telefono: savedDocente.telefono,
            nivel_asignado: savedDocente.nivelAsignado,
          }
        })
      };
    });
  }

  // 👑 ADMIN: Listar todos los usuarios
  async findAll() {
    return await this.usuarioRepository.find({
      select: ['id', 'email', 'rol', 'estado', 'createdAt'],
      order: { createdAt: 'DESC' },
      where: {
        estado: Estado.ACTIVO
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

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.findOne(id);

    Object.assign(usuario, updateUsuarioDto);
    usuario.updatedAt = new Date();

    return await this.usuarioRepository.save(usuario);
  }

  async remove(id: string) {
    const usuario = await this.findOne(id);
    return await this.usuarioRepository.remove(usuario);
  }

  // 👑 ADMIN: Cambiar estado de cualquier usuario
  async cambiarEstado(id: string) {
    const usuario = await this.findOne(id);

    const nuevoEstado =
      usuario.estado === Estado.ACTIVO ? Estado.INACTIVO : Estado.ACTIVO;

    await this.usuarioRepository.update(id, { estado: nuevoEstado });

    // Recuperar el usuario actualizado
    const usuarioActualizado = await this.findOne(id);

    return {
      message: `Usuario ${nuevoEstado === Estado.ACTIVO ? 'activado' : 'desactivado'} exitosamente`,
      usuario: usuarioActualizado,
    };
  }

  // 👑 ADMIN: Cambiar rol de usuario
  async cambiarRol(id: string, nuevoRol: Role) {
    const usuario = await this.findOne(id);

    await this.usuarioRepository.update(id, { rol: nuevoRol });

    // Recuperar el usuario actualizado
    const usuarioActualizado = await this.findOne(id);

    return {
      message: 'Rol actualizado exitosamente',
      usuario: usuarioActualizado,
      rol_anterior: usuario.rol,
      rol_nuevo: nuevoRol,
    };
  }

  // 👤 USUARIO: Cambiar contraseña propia
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