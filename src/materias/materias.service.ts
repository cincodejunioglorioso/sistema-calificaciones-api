import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoMateria, Materia } from './entities/materia.entity';
import { Repository } from 'typeorm';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';
import { EstadoPeriodo } from '../periodos-lectivos/entities/periodos-lectivo.entity';

@Injectable()
export class MateriasService {
    constructor(
        @InjectRepository(Materia)
        private readonly materiasRepository: Repository<Materia>,
        @InjectRepository(MateriaCurso)
        private readonly materiaCursoRepository: Repository<MateriaCurso>,
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

    /**
     * 🔍 Verificar si la materia tiene asignaciones con docentes en el período activo
     */
    async verificarAsignacionesActivas(materia_id: string): Promise<{
        tieneAsignaciones: boolean;
        totalAsignaciones: number;
        asignacionesConDocente: number;
    }> {
        const asignaciones = await this.materiaCursoRepository.find({
            where: { materia_id },
            relations: ['periodo_lectivo'],
        });

        // Solo considerar las del período activo
        const asignacionesActivas = asignaciones.filter(
            a => a.periodo_lectivo.estado === EstadoPeriodo.ACTIVO
        );

        const conDocente = asignacionesActivas.filter(a => a.docente_id !== null);

        return {
            tieneAsignaciones: asignacionesActivas.length > 0,
            totalAsignaciones: asignacionesActivas.length,
            asignacionesConDocente: conDocente.length,
        };
    }

    /**
     * 🔍 Verificar qué implicaciones tiene editar la materia
     */
    async verificarImplicacionesEdicion(id: string, updateDto: UpdateMateriaDto): Promise<{
        advertencias: string[];
        bloqueos: string[];
    }> {
        const materia = await this.findOne(id);
        const advertencias: string[] = [];
        const bloqueos: string[] = [];

        const { tieneAsignaciones, totalAsignaciones, asignacionesConDocente } =
            await this.verificarAsignacionesActivas(id);

        // Cambio de nombre
        if (updateDto.nombre && updateDto.nombre !== materia.nombre) {
            if (tieneAsignaciones) {
                advertencias.push(
                    `El cambio de nombre afectará a ${totalAsignaciones} asignación(es) activa(s) y se reflejará en libretas y reportes históricos.`
                );
            }
        }

        // Cambio de tipo de calificación
        if (updateDto.tipoCalificacion && updateDto.tipoCalificacion !== materia.tipoCalificacion) {
            if (tieneAsignaciones) {
                bloqueos.push(
                    `No se puede cambiar el tipo de calificación porque la materia tiene ${totalAsignaciones} asignación(es) en el período activo. ` +
                    `Desactive esta materia y cree una nueva con el tipo de calificación deseado.`
                );
            }
        }

        // Cambio de nivel educativo
        if (updateDto.nivelEducativo && updateDto.nivelEducativo !== materia.nivelEducativo) {
            if (tieneAsignaciones) {
                bloqueos.push(
                    `No se puede cambiar el nivel educativo porque la materia tiene ${totalAsignaciones} asignación(es) en el período activo. ` +
                    `Desactive esta materia y cree una nueva con el nivel educativo deseado.`
                );
            }
        }

        return { advertencias, bloqueos };
    }

    async update(id: string, updateMateriaDto: UpdateMateriaDto) {
        const materia = await this.findOne(id);
        if (!materia) throw new NotFoundException('Materia no encontrada');

        // 🆕 Verificar implicaciones antes de editar
        const { bloqueos } = await this.verificarImplicacionesEdicion(id, updateMateriaDto);

        if (bloqueos.length > 0) {
            throw new BadRequestException(bloqueos.join(' | '));
        }

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

        // 🆕 Si va a DESACTIVAR, verificar que no tenga docentes asignados
        if (materia.estado === EstadoMateria.ACTIVO) {
            const { asignacionesConDocente } = await this.verificarAsignacionesActivas(id);
            if (asignacionesConDocente > 0) {
                throw new BadRequestException(
                    `No se puede desactivar la materia porque tiene ${asignacionesConDocente} asignación(es) con docente(s) en el período activo. ` +
                    `Primero desasigne a los docentes desde la página de Asignaciones.`
                );
            }
        }

        const nuevoEstado = materia.estado === EstadoMateria.ACTIVO
            ? EstadoMateria.INACTIVO : EstadoMateria.ACTIVO;

        await this.materiasRepository.update(id, { estado: nuevoEstado });

        return {
            message: `Materia ${nuevoEstado === EstadoMateria.ACTIVO ? 'activada' : 'desactivada'} exitosamente`,
        };
    };
}