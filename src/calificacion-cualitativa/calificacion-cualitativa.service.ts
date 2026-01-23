import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CalificacionComponenteCualitativo } from './entities/calificacion-cualitativa.entity';
import { CalificacionComponente } from '../common/enums/cualitativa.enum';
import { CreateCalificacionCualitativaDto } from './dto/create-calificacion-cualitativa.dto';
import { UpdateCalificacionCualitativaDto } from './dto/update-calificacion-cualitativa.dto';
import { CalificarMasivoDto } from './dto/batch-calificacion-cualitativa.dto';
import { Materia, TipoCalificacion, NivelEducativo, EstadoMateria } from '../materias/entities/materia.entity';
import { Trimestre, TrimestreEstado } from '../trimestres/entities/trimestre.entity';
import { Curso } from '../cursos/entities/curso.entity';

@Injectable()
export class CalificacionCualitativaService {
  constructor(
    @InjectRepository(CalificacionComponenteCualitativo)
    private readonly calificacionRepository: Repository<CalificacionComponenteCualitativo>,
    @InjectRepository(Materia)
    private readonly materiaRepository: Repository<Materia>,
    @InjectRepository(Trimestre)
    private readonly trimestreRepository: Repository<Trimestre>,
    @InjectRepository(Curso)
    private readonly cursoRepository: Repository<Curso>,
  ) { }

  /**
   * 🔒 VALIDAR QUE EL DOCENTE SEA EL TUTOR DEL CURSO
   */
  private async validarAccesoTutor(curso_id: string, docente_id: string): Promise<void> {
    const curso = await this.cursoRepository.findOne({
      where: { id: curso_id },
      relations: ['docente'],
    });

    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }

    if (curso.docente_id !== docente_id) {
      throw new ForbiddenException('Solo el tutor del curso puede calificar componentes cualitativos');
    }
  }

  /**
   * ⭐ CALIFICACIÓN MASIVA
   */
  async calificarMasivo(dto: CalificarMasivoDto, docente_id: string) {
    const { curso_id, trimestre_id, calificaciones } = dto;

    await this.validarAccesoTutor(curso_id, docente_id);

    const trimestre = await this.trimestreRepository.findOne({
      where: { id: trimestre_id },
    });

    if (!trimestre) {
      throw new NotFoundException('Trimestre no encontrado');
    }

    if (trimestre.estado === TrimestreEstado.FINALIZADO) {
      throw new BadRequestException('No se pueden calificar componentes de trimestres finalizados');
    }

    const materiasIds = [...new Set(calificaciones.map(c => c.materia_id))];
    const materias = await this.materiaRepository.findByIds(materiasIds);

    const materiasInvalidas = materias.filter(m => m.tipoCalificacion !== TipoCalificacion.CUALITATIVA);
    if (materiasInvalidas.length > 0) {
      throw new BadRequestException(
        `Las siguientes materias no son cualitativas: ${materiasInvalidas.map(m => m.nombre).join(', ')}`
      );
    }

    const resultados = {
      creados: 0,
      actualizados: 0,
      errores: 0,
    };

    for (const cal of calificaciones) {
      try {
        const existente = await this.calificacionRepository.findOne({
          where: {
            estudiante_id: cal.estudiante_id,
            curso_id,
            materia_id: cal.materia_id,
            trimestre_id,
          },
        });

        if (existente) {
          // ACTUALIZAR
          existente.calificacion = cal.calificacion ?? null; // ✅ Usar nullish coalescing
          await this.calificacionRepository.save(existente);
          resultados.actualizados++;
        } else {
          // CREAR - Usar save() en lugar de create() + save()
          const nuevaCalificacion = {
            estudiante_id: cal.estudiante_id,
            curso_id,
            materia_id: cal.materia_id,
            trimestre_id,
            calificacion: cal.calificacion ?? null, // ✅ Usar nullish coalescing
          };

          await this.calificacionRepository.save(nuevaCalificacion);
          resultados.creados++;
        }
      } catch (error) {
        console.error(`Error al calificar estudiante ${cal.estudiante_id}:`, error);
        resultados.errores++;
      }
    }

    return {
      message: 'Calificación masiva completada',
      resultados,
    };
  }

  /**
   * 📊 OBTENER CALIFICACIONES POR CURSO Y TRIMESTRE
   */
  async findByCursoYTrimestre(curso_id: string, trimestre_id: string) {
    return await this.calificacionRepository.find({
      where: { curso_id, trimestre_id },
      order: {
        estudiante: { nombres_completos: 'ASC' },
        materia: { nombre: 'ASC' },
      },
    });
  }

  /**
   * 📄 OBTENER COMPONENTES DE UN ESTUDIANTE EN TODO EL PERIODO
   */
  async findByEstudiantePeriodo(estudiante_id: string, periodo_lectivo_id: string) {
    return await this.calificacionRepository
      .createQueryBuilder('cal')
      .innerJoinAndSelect('cal.materia', 'materia')
      .innerJoinAndSelect('cal.trimestre', 'trimestre')
      .innerJoinAndSelect('trimestre.periodo_lectivo', 'periodo')
      .where('cal.estudiante_id = :estudiante_id', { estudiante_id })
      .andWhere('periodo.id = :periodo_lectivo_id', { periodo_lectivo_id })
      .orderBy('materia.nombre', 'ASC')
      .addOrderBy('trimestre.nombre', 'ASC')
      .getMany();
  }

  /**
   * 🧮 CALCULAR PROMEDIO ANUAL POR MODA
   */
  async calcularPromedioAnual(
    estudiante_id: string,
    materia_id: string,
    periodo_lectivo_id: string
  ): Promise<CalificacionComponente | null> {
    const calificaciones = await this.calificacionRepository
      .createQueryBuilder('cal')
      .innerJoin('cal.trimestre', 'trimestre')
      .innerJoin('trimestre.periodo_lectivo', 'periodo')
      .where('cal.estudiante_id = :estudiante_id', { estudiante_id })
      .andWhere('cal.materia_id = :materia_id', { materia_id })
      .andWhere('periodo.id = :periodo_lectivo_id', { periodo_lectivo_id })
      .andWhere('cal.calificacion IS NOT NULL')
      .orderBy('trimestre.nombre', 'ASC')
      .getMany();

    if (calificaciones.length === 0) {
      return null;
    }

    const conteo: Record<string, number> = {};
    calificaciones.forEach(cal => {
      if (cal.calificacion) {
        conteo[cal.calificacion] = (conteo[cal.calificacion] || 0) + 1;
      }
    });

    let moda: CalificacionComponente | null = null;
    let maxFrecuencia = 0;

    for (const [valor, frecuencia] of Object.entries(conteo)) {
      if (frecuencia > maxFrecuencia) {
        maxFrecuencia = frecuencia;
        moda = valor as CalificacionComponente;
      }
    }

    if (maxFrecuencia === 1) {
      const ultimaCalificacion = calificaciones[calificaciones.length - 1];
      return ultimaCalificacion?.calificacion ?? null;
    }

    return moda;
  }

  /**
   * 📋 OBTENER COMPONENTES SEGÚN NIVEL EDUCATIVO
   */
  async obtenerComponentesPorNivel(nivelEducativo: NivelEducativo) {
    const componentes = await this.materiaRepository.find({
      where: {
        tipoCalificacion: TipoCalificacion.CUALITATIVA,
        nivelEducativo: In([nivelEducativo, NivelEducativo.GENERAL]),
        estado: EstadoMateria.ACTIVO,
      },
      order: {
        nombre: 'ASC',
      },
    });
    return componentes;
  }

  /**
   * CRUD BÁSICO
   */
  async findOne(id: string) {
    const calificacion = await this.calificacionRepository.findOne({
      where: { id },
    });

    if (!calificacion) {
      throw new NotFoundException('Calificación no encontrada');
    }

    return calificacion;
  }

  /**
   * ✏️ ACTUALIZAR calificación individual (usado por tutor)
   */
  async update(id: string, updateDto: UpdateCalificacionCualitativaDto, docente_id?: string) {
    const calificacion = await this.findOne(id);

    // Validar acceso si se proporciona docente_id
    if (docente_id) {
      await this.validarAccesoTutor(calificacion.curso_id, docente_id);
    }

    const trimestre = await this.trimestreRepository.findOne({
      where: { id: calificacion.trimestre_id },
    });

    if (!trimestre) {
      throw new NotFoundException('Trimestre no encontrado');
    }

    if (trimestre.estado === TrimestreEstado.FINALIZADO) {
      throw new BadRequestException('No se pueden modificar calificaciones de trimestres finalizados');
    }

    Object.assign(calificacion, updateDto);
    return await this.calificacionRepository.save(calificacion);
  }

  /**
   * 🗑️ ELIMINAR calificación individual (usado por tutor)
   */
  async remove(id: string, docente_id?: string) {
    const calificacion = await this.findOne(id);

    // Validar acceso si se proporciona docente_id
    if (docente_id) {
      await this.validarAccesoTutor(calificacion.curso_id, docente_id);
    }

    const trimestre = await this.trimestreRepository.findOne({
      where: { id: calificacion.trimestre_id },
    });

    if (!trimestre) {
      throw new NotFoundException('Trimestre no encontrado');
    }

    if (trimestre.estado === TrimestreEstado.FINALIZADO) {
      throw new BadRequestException('No se pueden eliminar calificaciones de trimestres finalizados');
    }

    await this.calificacionRepository.remove(calificacion);
    return { message: 'Calificación eliminada exitosamente' };
  }
}