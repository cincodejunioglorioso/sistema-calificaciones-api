import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Docente } from './entities/docente.entity';
import { Status, Usuario } from 'src/usuarios/entities/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateDocenteDto } from './dto/update-docente.dto';
import { CompletarPerfilDto } from './dto/completar-perfil.dto';

@Injectable()
export class DocentesService {
  constructor(
    @InjectRepository(Docente)
    private readonly docenteRepository: Repository<Docente>,
  ) { }

  // 👑 ADMIN: Listar todos los docentes
  async findAll() {
    return await this.docenteRepository.find({
      relations: ['usuario_id'],
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        cedula: true,
        telefono: true,
        nivelAsignado: true,
        perfil_completo: true,
        createdAt: true,
        usuario_id: {
          id: true,
          email: true,
          estado: true,
          rol: true
        }
      }
    });
  }

  // 👑 ADMIN: Obtener docente específico
  async findOne(id: string) {
    const docente = await this.docenteRepository.findOne({
      where: { id },
      relations: ['usuario_id'],
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        cedula: true,
        telefono: true,
        nivelAsignado: true,
        foto_perfil_url: true,
        foto_titulo_url: true,
        perfil_completo: true,
        createdAt: true,
        updatedAt: true,
        usuario_id: {
          id: true,
          email: true,
          estado: true,
          rol: true,
          createdAt: true
        }
      }
    });

    if (!docente) {
      throw new NotFoundException('Docente no encontrado');
    }

    return docente;
  }

  // 👤 DOCENTE: Obtener mi perfil por userId
  async findByUserId(userId: string) {
    const docente = await this.docenteRepository.findOne({
      where: { usuario_id: { id: userId } },
      relations: ['usuario_id']
    });

    if (!docente) {
      throw new NotFoundException('Perfil de docente no encontrado');
    }

    return docente;
  }  

  // 👑 ADMIN: Actualizar datos del docente
  async update(id: string, updateDocenteDto: UpdateDocenteDto) {
    const docente = await this.docenteRepository.findOne({
      where: { id },
      relations: ['usuario_id']
    });

    if (!docente) {
      throw new NotFoundException('Docente no encontrado');
    }

    Object.assign(docente, updateDocenteDto);
    const updatedDocente = await this.docenteRepository.save(docente);

    return {
      message: 'Docente actualizado exitosamente',
      docente: updatedDocente
    };
  }

  // 👤 DOCENTE: Completar mi propio perfil
  async completarPerfil(userId: string, completarPerfilDto: CompletarPerfilDto) {
    const docente = await this.findByUserId(userId);
    
    if (!docente) {
      throw new NotFoundException('Docente no encontrado');
    }

    Object.assign(docente, completarPerfilDto);

    const camposImportantes = ['foto_titulo_url', 'foto_perfil_url'];

    const camposCompletos = camposImportantes.every(campo =>
      docente[campo] && docente[campo].trim() !== ''
    );
      
    if (camposCompletos) {
      docente.perfil_completo = true;
    }

    const updatedDocente = await this.docenteRepository.save(docente);

    return {
      message: 'Perfil de docente completado exitosamente',
      perfil_completo: updatedDocente.perfil_completo,
      docente: updatedDocente
    };
  }

}