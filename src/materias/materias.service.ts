import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoMateria, Materia } from './entities/materia.entity';
import { Repository } from 'typeorm';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';

@Injectable()
export class MateriasService {
    constructor(
        @InjectRepository(Materia)
        private readonly materiasRepository: Repository<Materia>
    ) { }

    async create(createMateriaDto: CreateMateriaDto) {
        const materia = this.materiasRepository.create(createMateriaDto);
        return await this.materiasRepository.save(materia);
    };

    async findAll() {

        const materias = await this.materiasRepository.find({
            order: { createdAt: 'DESC' }
        });

        if (materias.length === 0) {
            throw new NotFoundException('No hay materias registradas');
        }

        return materias;
    };

    async findOne(id: string) {
        const materia = await this.materiasRepository.findOne({
            where: { id }
        });

        if (!materia) throw new NotFoundException('Materia no encontrada');

        return materia;
    };

    async update(id: string, updateMateriaDto: UpdateMateriaDto) {
        const materia = await this.findOne(id);
        if (!materia) throw new NotFoundException('Materia no encontrada');

        Object.assign(materia, updateMateriaDto);
        const updatedMateria = await this.materiasRepository.save(materia);

        return {
            message: 'Materia actualizada exitosamente',
            materia: updatedMateria
        }
    };

    async remove(id: string) {
        const materia = await this.findOne(id);
        if (!materia) throw new NotFoundException('Materia no encontrada');

        const nuevoEstado = materia.estado === EstadoMateria.ACTIVO
            ? EstadoMateria.INACTIVO : EstadoMateria.ACTIVO;

        await this.materiasRepository.update(id, { estado: nuevoEstado });


        return {
            message: `Materia ${nuevoEstado === EstadoMateria.ACTIVO ? 'activada' : 'desactivada'} exitosamente`,
        };
    };

}
