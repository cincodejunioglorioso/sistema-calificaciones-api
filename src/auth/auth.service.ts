import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, Usuario } from 'src/usuarios/entities/usuario.entity';
import { DataSource, Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { Docente, nivelAsignado } from 'src/docentes/entities/docente.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Docente)
    private docenteRepository: Repository<Docente>,
    private datasource: DataSource,
    private jwtService: JwtService,
  )  {}
  
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

      if (savedUser.rol === Role.DOCENTE) {
        const docente = manager.create(Docente, {
          nombres,
          apellidos,
          cedula,
          telefono,
          nivelAsignado: nivel || nivelAsignado.BASICA,
          usuario_id: savedUser,
          perfil_completo: false
        });

        savedDocente = await manager.save(docente);
      }

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

  async login (loginDto: LoginDto) {
    const { email, password } = loginDto;
    const usuario = await this.usuarioRepository.findOne(
      {
        where: { email }
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
      rol: usuario.rol
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
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