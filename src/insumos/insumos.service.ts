import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoInsumo, Insumo } from './entities/insumo.entity';
import { Repository } from 'typeorm';
import { TrimestreEstado } from '../trimestres/entities/trimestre.entity';
import { EstadoPeriodo } from '../periodos-lectivos/entities/periodos-lectivo.entity';
import { CalificacionInsumo } from '../calificacion_insumo/entities/calificacion_insumo.entity';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';

@Injectable()
export class InsumosService {

  constructor(
    @InjectRepository(Insumo)
    private readonly insumoRepository: Repository<Insumo>,
    @InjectRepository(CalificacionInsumo)
    private readonly calificacionInsumoRepository: Repository<CalificacionInsumo>,
    @InjectRepository(MateriaCurso)
    private readonly materiaCursoRepository: Repository<MateriaCurso>
  ) { }

  async create(createInsumoDto: CreateInsumoDto, docente_id: string) {

    const insumos = await this.insumoRepository.count({
      where: {
        materia_curso_id: createInsumoDto.materia_curso_id,
        trimestre_id: createInsumoDto.trimestre_id,
      }
    });

    if (insumos >= 9) {
      throw new BadRequestException('No se pueden crear más insumos para este curso y trimestre (límite de 9 alcanzado)');
    }

    let nombre = createInsumoDto.nombre;
    if (!nombre) {
      nombre = `Insumo ${insumos + 1}`;
    }

    const insumo = this.insumoRepository.create({
      ...createInsumoDto,
      nombre,
      docente_id: docente_id,
    });

    const savedInsumo = await this.insumoRepository.save(insumo);

    const insumoConRelaciones = await this.findOne(savedInsumo.id);

    if (insumoConRelaciones.trimestre.estado !== TrimestreEstado.ACTIVO) {
      await this.insumoRepository.remove(savedInsumo);
      throw new BadRequestException('No se pueden crear insumos para un trimestre que no está activo');
    }

    if (insumoConRelaciones.trimestre.periodo_lectivo.estado !== EstadoPeriodo.ACTIVO) {
      await this.insumoRepository.remove(savedInsumo);
      throw new BadRequestException('Solo se pueden crear insumos en períodos lectivos activos');
    }

    if (insumoConRelaciones.materia_curso.docente_id !== docente_id) {
      await this.insumoRepository.remove(savedInsumo);
      throw new ForbiddenException('Solo el docente asignado puede crear insumos para esta materia');
    }

    return insumoConRelaciones;
  }

  async findAll() {
    const insumos = await this.insumoRepository.find({
      order: { createdAt: 'DESC' }
    });

    if (!insumos || insumos.length === 0) {
      throw new NotFoundException('No se encontraron insumos');
    }

    return insumos;
  }


  async findOne(id: string) {
    const insumo = await this.insumoRepository.findOne({
      where: { id }
    });

    if (!insumo) {
      throw new NotFoundException('Insumo no encontrado');
    }

    return insumo;
  }

  async findByMateriaCursoYTrimestre(materia_curso_id: string, trimestre_id: string) {
    let insumos = await this.insumoRepository.find({
      where: { materia_curso_id, trimestre_id },
      order: { 
        createdAt: 'ASC',
        nombre: 'ASC'
      }
    });

    if (!insumos || insumos.length === 0) {
      const materiaCurso = await this.materiaCursoRepository.findOne({
        where: { id: materia_curso_id }
      });

      if (!materiaCurso) {
        throw new NotFoundException('Materia-curso no encontrada');
      }

      if (!materiaCurso.docente_id) {
        throw new BadRequestException('La materia no tiene un docente asignado');
      }

      try {
        await this.insumoRepository.manager.transaction(
          'SERIALIZABLE',
          async (transactionalEntityManager) => {
            const count = await transactionalEntityManager.count(Insumo, {
              where: { materia_curso_id, trimestre_id }
            });

            if (count === 0) {
              const nuevosInsumos: Partial<Insumo>[] = [];
              for (let i = 1; i <= 3; i++) {
                nuevosInsumos.push({
                  materia_curso_id,
                  trimestre_id,
                  docente_id: materiaCurso.docente_id,
                  nombre: `Insumo ${i}`,
                  estado: EstadoInsumo.BORRADOR,
                });
              }
              await transactionalEntityManager.save(Insumo, nuevosInsumos);
            }
          }
        );
      } catch (error) {
        // Si la transacción serializable falla por concurrencia,
        // el otro request ya creó los insumos - simplemente continuamos
      }

      // Siempre re-consultar: si esta transacción creó los insumos o la otra lo hizo
      insumos = await this.insumoRepository.find({
        where: { materia_curso_id, trimestre_id },
        order: { createdAt: 'ASC' }
      });
    }

    return insumos;
  }

  async update(id: string, updateInsumoDto: UpdateInsumoDto, docente_id: string) {
    const insumo = await this.findOne(id);

    if (insumo.estado === EstadoInsumo.PUBLICADO) {
      throw new ForbiddenException('No se puede editar un insumo publicado. Solicita al admin que lo reactive.');
    }

    if (insumo.estado === EstadoInsumo.CERRADO) {
      throw new ForbiddenException('No se puede editar un insumo cerrado');
    }

    if (insumo.materia_curso.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el docente asignado puede editar este insumo');
    }

    Object.assign(insumo, updateInsumoDto);
    return await this.insumoRepository.save(insumo);
  }

  async remove(id: string, docente_id: string) {
    const insumo = await this.findOne(id);

    if (insumo.estado === EstadoInsumo.PUBLICADO || insumo.estado === EstadoInsumo.CERRADO) {
      throw new ForbiddenException('No se puede eliminar un insumo publicado o cerrado');
    }

    if (insumo.materia_curso.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el docente asignado puede eliminar este insumo');
    }

    const totalInsumos = await this.insumoRepository.count({
      where: {
        materia_curso_id: insumo.materia_curso_id,
        trimestre_id: insumo.trimestre_id,
      }
    });

    if (totalInsumos <= 3) {
      throw new ForbiddenException('No puedes eliminar este insumo. Debe haber mínimo 3 insumos por trimestre.');
    }

    const calificaciones = await this.calificacionInsumoRepository.find({
      where: { insumo_id: id }
    });

    if (calificaciones.length > 0) {
      await this.calificacionInsumoRepository.remove(calificaciones);
    }

    await this.insumoRepository.remove(insumo);

    return { message: 'Insumo eliminado correctamente' };
  }

  async publicar(id: string, docente_id: string) {
    const insumo = await this.findOne(id);

    if (insumo.estado !== EstadoInsumo.ACTIVO) {
      throw new BadRequestException('Solo se pueden publicar insumos en estado ACTIVO');
    }

    if (insumo.materia_curso.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el docente asignado puede publicar este insumo');
    }

    insumo.estado = EstadoInsumo.PUBLICADO;
    await this.insumoRepository.save(insumo);

    return insumo;
  }

  async reactivar(id: string) {
    const insumo = await this.findOne(id);

    if (insumo.estado !== EstadoInsumo.PUBLICADO) {
      throw new BadRequestException('Solo se pueden reactivar insumos publicados');
    }

    insumo.estado = EstadoInsumo.ACTIVO;
    await this.insumoRepository.save(insumo);

    return insumo;
  }

  async cerrarInsumosDeTrimestre(trimestre_id: string) {
    const insumos = await this.insumoRepository.find({
      where: { trimestre_id }
    });

    for (const insumo of insumos) {
      if (insumo.estado !== EstadoInsumo.CERRADO) {
        insumo.estado = EstadoInsumo.CERRADO;
        await this.insumoRepository.save(insumo);
      }
    }

    return { cantidad: insumos.length };
  }

  async reabrirInsumosDeTrimestre(trimestre_id: string) {
    const insumos = await this.insumoRepository.find({
      where: {
        trimestre_id,
        estado: EstadoInsumo.CERRADO
      }
    });

    let reabiertos = 0;
    for (const insumo of insumos) {
      insumo.estado = EstadoInsumo.PUBLICADO;
      await this.insumoRepository.save(insumo);
      reabiertos++;
    }

    return {
      cantidad: reabiertos
    };
  }

  async cambiarEstadoAActivo(id: string) {
    const insumo = await this.findOne(id);

    if (insumo.estado === EstadoInsumo.BORRADOR) {
      insumo.estado = EstadoInsumo.ACTIVO;
      await this.insumoRepository.save(insumo);
    }

    return insumo;
  }

  async contarPorEstado(materia_curso_id: string, trimestre_id: string) {
    const insumos = await this.findByMateriaCursoYTrimestre(materia_curso_id, trimestre_id);

    const conteo = {
      borrador: 0,
      activo: 0,
      publicado: 0,
      cerrado: 0,
      total: insumos.length
    };

    insumos.forEach(insumo => {
      switch (insumo.estado) {
        case EstadoInsumo.BORRADOR:
          conteo.borrador++;
          break;
        case EstadoInsumo.ACTIVO:
          conteo.activo++;
          break;
        case EstadoInsumo.PUBLICADO:
          conteo.publicado++;
          break;
        case EstadoInsumo.CERRADO:
          conteo.cerrado++;
          break;
      }
    });

    return conteo;
  }

  async validarMinimoInsumos(materia_curso_id: string, trimestre_id: string): Promise<boolean> {
    const cantidad = await this.insumoRepository.count({
      where: {
        materia_curso_id,
        trimestre_id
      }
    });

    return cantidad >= 3;
  }
}
