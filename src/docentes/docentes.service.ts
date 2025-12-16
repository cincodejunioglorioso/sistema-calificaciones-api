// nest-backend/src/docentes/docentes.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Docente } from './entities/docente.entity';
import { Estado, Usuario } from '../usuarios/entities/usuario.entity';
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

    // Actualizar solo campos del docente
    Object.assign(docente, updateDocenteDto);
    const updatedDocente = await this.docenteRepository.save(docente);

    // Recuperar con todas las relaciones para la respuesta
    const docenteCompleto = await this.docenteRepository.findOne({
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

    return {
      message: 'Docente actualizado exitosamente',
      docente: docenteCompleto
    };
  }

  // 👤 DOCENTE: Completar mi propio perfil
  async completarPerfil(userId: string, completarPerfilDto: CompletarPerfilDto) {
    const docente = await this.findByUserId(userId);

    if (!docente) {
      throw new NotFoundException('Docente no encontrado');
    }

    // Filtrar campos vacíos y null antes de asignar
    const datosLimpios = Object.entries(completarPerfilDto).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    Object.assign(docente, datosLimpios);

    const camposImportantes = ['foto_titulo_url', 'foto_perfil_url'];

    const camposCompletos = camposImportantes.every(campo =>
      docente[campo] && docente[campo].trim() !== ''
    );

    if (camposCompletos) {
      docente.perfil_completo = true;
    }

    const updatedDocente = await this.docenteRepository.save(docente);

    // Recuperar con relaciones completas
    const docenteCompleto = await this.docenteRepository.findOne({
      where: { id: updatedDocente.id },
      relations: ['usuario_id']
    });

    if (!docenteCompleto) {
      throw new NotFoundException('Error al recuperar docente actualizado');
    }

    return {
      perfil_completo: docenteCompleto.perfil_completo,
      docente: docenteCompleto
    };
  }
}