import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, Usuario } from '../usuarios/entities/usuario.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private jwtService: JwtService,
  )  {}

  async login (loginDto: LoginDto) {
    const { email, password } = loginDto;
    const usuario = await this.usuarioRepository.findOne(
      {
        where: { email },
        relations: ['docente'],
      }
    );

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, usuario.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      docente_id: usuario.rol === Role.DOCENTE && usuario.docente ? usuario.docente.id : null,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        docente_id: payload.docente_id,
      }
    };
  }

  async findOne(id: string): Promise<any> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      select: ['id', 'email', 'rol', 'estado']
    });
    return usuario;
  }
}