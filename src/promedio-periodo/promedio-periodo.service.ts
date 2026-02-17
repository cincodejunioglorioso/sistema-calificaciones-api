// nest-backend/src/promedio-periodo/promedio-periodo.service.ts

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EstadoPromedioAnual, PromedioPeriodo } from './entities/promedio-periodo.entity';
import { CreatePromedioPeriodoDto } from './dto/create-promedio-periodo.dto';
import { UpdatePromedioPeriodoDto } from './dto/update-promedio-periodo.dto';
import { RegistrarSupletorioDto } from './dto/registrar-supletorio.dto';
import { PromedioTrimestre } from '../promedio-trimestre/entities/promedio-trimestre.entity';
import { Matricula, EstadoMatricula } from '../matriculas/entities/matricula.entity';
import { MateriaCurso } from '../materia-curso/entities/materia-curso.entity';
import { PeriodoLectivo, EstadoPeriodo, EstadoSupletorio } from '../periodos-lectivos/entities/periodos-lectivo.entity';
import { NombreTrimestre, Trimestre, TrimestreEstado } from '../trimestres/entities/trimestre.entity';
import { calcularConversionCualitativa } from '../common/constants/escalas.constants';
import { ResultadoGeneracionPeriodoMasiva } from './dto/resultado-generacion-masiva.interface';
import { ConversionCualitativa } from '../common/enums/cualitativa.enum';
import { EstadoEstudiante } from '../estudiantes/entities/estudiante.entity';
import { EstadoMateria, TipoCalificacion } from '../materias/entities/materia.entity';

@Injectable()
export class PromedioPeriodoService {
  constructor(
    @InjectRepository(PromedioPeriodo)
    private readonly promedioPeriodoRepository: Repository<PromedioPeriodo>,
    @InjectRepository(PromedioTrimestre)
    private readonly promedioTrimestreRepository: Repository<PromedioTrimestre>,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    @InjectRepository(MateriaCurso)
    private readonly materiaCursoRepository: Repository<MateriaCurso>,
    @InjectRepository(PeriodoLectivo)
    private readonly periodoLectivoRepository: Repository<PeriodoLectivo>,
    @InjectRepository(Trimestre)
    private readonly trimestreRepository: Repository<Trimestre>,
  ) { }

  /**
   * 👑 ADMIN: Crear promedio anual individual (manual excepcional)
   */
  async create(createDto: CreatePromedioPeriodoDto) {
    const { estudiante_id, materia_curso_id, periodo_lectivo_id } = createDto;

    // Validar que no exista
    const existente = await this.promedioPeriodoRepository.findOne({
      where: { estudiante_id, materia_curso_id, periodo_lectivo_id }
    });

    if (existente) {
      throw new BadRequestException('Ya existe un promedio anual para este estudiante en esta materia-periodo');
    }

    // Validar materia-curso
    const materiaCurso = await this.materiaCursoRepository.findOne({
      where: { id: materia_curso_id },
      relations: ['curso']
    });

    if (!materiaCurso) {
      throw new NotFoundException('Materia-Curso no encontrada');
    }

    // Validar período lectivo
    const periodoLectivo = await this.periodoLectivoRepository.findOne({
      where: { id: periodo_lectivo_id }
    });

    if (!periodoLectivo) {
      throw new NotFoundException('Período lectivo no encontrado');
    }

    // Validar matrícula
    const matricula = await this.matriculaRepository.findOne({
      where: {
        estudiante_id,
        curso_id: materiaCurso.curso_id,
        estado: EstadoMatricula.ACTIVO
      }
    });

    if (!matricula) {
      throw new BadRequestException('El estudiante no está matriculado en el curso de esta materia');
    }

    // Obtener los 3 trimestres
    const trimestres = await this.trimestreRepository.find({
      where: { periodo_lectivo_id },
      order: { nombre: 'ASC' }
    });

    if (trimestres.length !== 3) {
      throw new BadRequestException('El período lectivo debe tener exactamente 3 trimestres');
    }

    // Validar que los 3 trimestres estén FINALIZADOS
    const trimestresNoFinalizados = trimestres.filter(t => t.estado !== TrimestreEstado.FINALIZADO);
    if (trimestresNoFinalizados.length > 0) {
      throw new BadRequestException(
        `Todos los trimestres deben estar finalizados. Pendientes: ${trimestresNoFinalizados.map(t => t.nombre).join(', ')}`
      );
    }

    // Obtener promedios trimestrales
    const promediosTrimestrales = await Promise.all(
      trimestres.map(trimestre =>
        this.promedioTrimestreRepository.findOne({
          where: {
            estudiante_id,
            materia_curso_id,
            trimestre_id: trimestre.id
          }
        })
      )
    );

    // Validar que existan los 3 promedios
    if (promediosTrimestrales.some(p => !p)) {
      const faltantes = trimestres
        .filter((_, index) => !promediosTrimestrales[index])
        .map(t => t.nombre)
        .join(', ');
      throw new BadRequestException(`Faltan promedios trimestrales: ${faltantes}`);
    }

    const [t1, t2, t3] = promediosTrimestrales;

    if (!t1 || !t2 || !t3) {
      throw new BadRequestException('Faltan promedios trimestrales para calcular el promedio anual');
    }

    const sumaTrimestres = Number(t1.nota_final_trimestre) + Number(t2.nota_final_trimestre) + Number(t3.nota_final_trimestre);

    const promedio_anual = Math.round((sumaTrimestres / 3) * 100) / 100;

    // Calcular cualitativa anual
    const cualitativa_anual = calcularConversionCualitativa(promedio_anual);

    // Determinar estado
    let estado: EstadoPromedioAnual;
    if (promedio_anual >= 7.0) {
      estado = EstadoPromedioAnual.APROBADO;
    } else if (promedio_anual < 5.0) {
      estado = EstadoPromedioAnual.REPROBADO;
    } else {
      estado = EstadoPromedioAnual.SUPLETORIO;
    }

    // Crear promedio anual
    const promedioPeriodo = this.promedioPeriodoRepository.create({
      estudiante_id,
      materia_curso_id,
      periodo_lectivo_id,
      nota_trimestre_1: Number(t1.nota_final_trimestre),
      nota_trimestre_2: Number(t2.nota_final_trimestre),
      nota_trimestre_3: Number(t3.nota_final_trimestre),
      promedio_anual,
      cualitativa_anual,
      estado,
      observaciones: createDto.observaciones
    });

    return await this.promedioPeriodoRepository.save(promedioPeriodo);
  }

  /**
   * 🚀 OPTIMIZADO: Generar promedios anuales masivos para todo un período lectivo
   * Reduce 7,000+ queries → ~8 queries
   */
  async generarPromediosMasivo(periodo_lectivo_id: string): Promise<ResultadoGeneracionPeriodoMasiva> {
    const startTime = Date.now();

    const periodoLectivo = await this.periodoLectivoRepository.findOne({
      where: { id: periodo_lectivo_id }
    });

    if (!periodoLectivo) {
      throw new NotFoundException('Período lectivo no encontrado');
    }

    // 🔥 OPTIMIZACIÓN 1: Obtener trimestres UNA VEZ
    const trimestres = await this.trimestreRepository.find({
      where: { periodo_lectivo_id },
      order: { nombre: 'ASC' }
    });

    if (trimestres.length !== 3) {
      throw new BadRequestException('El período debe tener exactamente 3 trimestres');
    }

    const trimestresNoFinalizados = trimestres.filter(t => t.estado !== TrimestreEstado.FINALIZADO);

    if (trimestresNoFinalizados.length > 0) {
      throw new BadRequestException(
        `No se pueden generar promedios anuales: los trimestres ${trimestresNoFinalizados.map(t => t.nombre).join(', ')} no están finalizados`
      );
    }

    const resultado: ResultadoGeneracionPeriodoMasiva = {
      total_procesados: 0,
      total_generados: 0,
      total_fallidos: 0,
      estudiantes_incompletos: []
    };

    // 🔥 OPTIMIZACIÓN 2: Obtener todas las materias-curso de una vez
    const materiasCurso = await this.materiaCursoRepository.find({
      where: {
        curso: { periodo_lectivo_id }
      },
      relations: ['curso', 'materia']
    });

    // Filtrar solo materias cuantitativas
    const materiasCuantitativas = materiasCurso.filter(
      mc => mc.materia.tipoCalificacion === TipoCalificacion.CUANTITATIVA
      && mc.materia.estado === EstadoMateria.ACTIVO 
    );

    if (materiasCuantitativas.length === 0) {
      return resultado;
    }

    // 🔥 OPTIMIZACIÓN 3: Obtener IDs de todos los cursos
    const cursosIds = [...new Set(materiasCuantitativas.map(mc => mc.curso_id))];

    // 🔥 OPTIMIZACIÓN 4: Batch query - Todas las matrículas activas
    const matriculas = await this.matriculaRepository.find({
      where: {
        curso_id: In(cursosIds),
        estado: EstadoMatricula.ACTIVO
      },
      relations: ['estudiante']
    });

    const matriculasActivas = matriculas.filter(
      m => m.estudiante.estado !== EstadoEstudiante.INACTIVO_TEMPORAL
    );

    if (matriculasActivas.length === 0) {
      return resultado;
    }

    // 🔥 OPTIMIZACIÓN 5: Batch query - Promedios anuales ya existentes
    const materiasIds = materiasCuantitativas.map(mc => mc.id);
    const estudiantesIds = matriculasActivas.map(m => m.estudiante_id);

    const promediosExistentes = await this.promedioPeriodoRepository.find({
      where: {
        materia_curso_id: In(materiasIds),
        estudiante_id: In(estudiantesIds),
        periodo_lectivo_id
      },
      select: ['estudiante_id', 'materia_curso_id']
    });

    const yaExistenSet = new Set(
      promediosExistentes.map(p => `${p.estudiante_id}:${p.materia_curso_id}`)
    );

    // 🔥 OPTIMIZACIÓN 6: Batch query - TODOS los promedios trimestrales de los 3 trimestres
    const trimestresIds = trimestres.map(t => t.id);

    const todosPromediosTrimestrales = await this.promedioTrimestreRepository.find({
      where: {
        estudiante_id: In(estudiantesIds),
        materia_curso_id: In(materiasIds),
        trimestre_id: In(trimestresIds)
      },
      select: ['estudiante_id', 'materia_curso_id', 'trimestre_id', 'nota_final_trimestre']
    });

    // 🔥 OPTIMIZACIÓN 7: Crear Maps para acceso O(1)
    // Estructura: Map<"estudiante_id:materia_id", { t1, t2, t3 }>
    const promediosTrimestralesMap = new Map<string, {
      t1: number | null;
      t2: number | null;
      t3: number | null;
    }>();

    todosPromediosTrimestrales.forEach(pt => {
      const key = `${pt.estudiante_id}:${pt.materia_curso_id}`;

      if (!promediosTrimestralesMap.has(key)) {
        promediosTrimestralesMap.set(key, { t1: null, t2: null, t3: null });
      }

      const registro = promediosTrimestralesMap.get(key)!;

      // Identificar trimestre por ID
      if (pt.trimestre_id === trimestres[0].id) {
        registro.t1 = Number(pt.nota_final_trimestre);
      } else if (pt.trimestre_id === trimestres[1].id) {
        registro.t2 = Number(pt.nota_final_trimestre);
      } else if (pt.trimestre_id === trimestres[2].id) {
        registro.t3 = Number(pt.nota_final_trimestre);
      }
    });

    // 🔥 OPTIMIZACIÓN 8: Procesar en memoria y guardar en batch
    const promediosACrear: PromedioPeriodo[] = [];
    const BATCH_SIZE = 100;

    for (const materiaCurso of materiasCuantitativas) {
      const matriculasDelCurso = matriculasActivas.filter(m => m.curso_id === materiaCurso.curso_id);

      for (const matricula of matriculasDelCurso) {
        resultado.total_procesados++;

        const key = `${matricula.estudiante_id}:${materiaCurso.id}`;

        // Skip si ya existe
        if (yaExistenSet.has(key)) {
          continue;
        }

        try {
          // Obtener promedios trimestrales desde el Map
          const promediosTrimestre = promediosTrimestralesMap.get(key);

          if (!promediosTrimestre) {
            throw new Error('No tiene promedios trimestrales');
          }

          const { t1, t2, t3 } = promediosTrimestre;

          if (t1 === null || t2 === null || t3 === null) {
            const faltantes: string[] = [];
            if (t1 === null) faltantes.push(trimestres[0].nombre);
            if (t2 === null) faltantes.push(trimestres[1].nombre);
            if (t3 === null) faltantes.push(trimestres[2].nombre);
            throw new Error(`Faltan promedios trimestrales: ${faltantes.join(', ')}`);
          }

          // Calcular promedio anual
          const sumaTrimestres = t1 + t2 + t3;
          const promedio_anual = Math.round((sumaTrimestres / 3) * 100) / 100;
          const cualitativa_anual = calcularConversionCualitativa(promedio_anual);

          // Determinar estado
          let estado: EstadoPromedioAnual;
          if (promedio_anual >= 7.0) {
            estado = EstadoPromedioAnual.APROBADO;
          } else if (promedio_anual < 5.0) {
            estado = EstadoPromedioAnual.REPROBADO;
          } else {
            estado = EstadoPromedioAnual.SUPLETORIO;
          }

          const promedioPeriodo = this.promedioPeriodoRepository.create({
            estudiante_id: matricula.estudiante_id,
            materia_curso_id: materiaCurso.id,
            periodo_lectivo_id,
            nota_trimestre_1: t1,
            nota_trimestre_2: t2,
            nota_trimestre_3: t3,
            promedio_anual,
            cualitativa_anual,
            estado
          });

          promediosACrear.push(promedioPeriodo);

          // 🔥 Guardar en batches
          if (promediosACrear.length >= BATCH_SIZE) {
            await this.promedioPeriodoRepository.save(promediosACrear);
            resultado.total_generados += promediosACrear.length;
            promediosACrear.length = 0;
          }

        } catch (error) {
          resultado.total_fallidos++;
          resultado.estudiantes_incompletos.push({
            estudiante: matricula.estudiante.nombres_completos,
            estudiante_cedula: matricula.estudiante.estudiante_cedula,
            materia: materiaCurso.materia.nombre,
            curso: `${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`,
            error: error.message
          });
        }
      }
    }

    // 🔥 Guardar el último batch
    if (promediosACrear.length > 0) {
      await this.promedioPeriodoRepository.save(promediosACrear);
      resultado.total_generados += promediosACrear.length;
    }

    const endTime = Date.now();
    const tiempoTotal = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Promedios anuales generados en ${tiempoTotal} segundos`);
    console.log(`📊 Total procesados: ${resultado.total_procesados}`);
    console.log(`✅ Total generados: ${resultado.total_generados}`);
    console.log(`❌ Total fallidos: ${resultado.total_fallidos}`);

    return resultado;
  }

  async rollbackPromediosPeriodo(periodo_lectivo_id: string) {
    const promedios = await this.promedioPeriodoRepository.find({
      where: { periodo_lectivo_id }
    });

    if (promedios.length === 0) {
      return {
        eliminados: 0,
        mensaje: 'No había promedios anuales para eliminar'
      };
    }

    await this.promedioPeriodoRepository.remove(promedios);

    return {
      eliminados: promedios.length,
      mensaje: `${promedios.length} promedios anuales eliminados. Se regenerarán al finalizar el trimestre 3 nuevamente.`
    };
  }

  // 🎓 DOCENTE: Registrar nota de supletorio
  async registrarSupletorio(id: string, dto: RegistrarSupletorioDto, docente_id: string) {
    const promedioPeriodo = await this.findOne(id);

    // NUEVA VALIDACIÓN: Verificar que el período esté en estado SUPLETORIOS
    const periodo = await this.periodoLectivoRepository.findOne({
      where: { id: promedioPeriodo.periodo_lectivo_id }
    });

    if (!periodo) {
      throw new NotFoundException('Período lectivo no encontrado');
    }

    if (periodo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException(
        `El período está ${periodo.estado}. Solo se permite calificar en períodos ACTIVOS.`
      );
    }

    // 🔥 VALIDACIÓN CRÍTICA: Solo permitir calificar cuando está ACTIVADO
    if (periodo.estado_supletorio !== EstadoSupletorio.ACTIVADO) {
      throw new BadRequestException(
        `No se pueden registrar calificaciones de supletorio. ` +
        `Estado actual: ${periodo.estado_supletorio}. ` +
        `Solo se permite calificar cuando el estado de supletorios es ACTIVADO.`
      );
    }

    // Validar que el docente sea el asignado a la materia
    if (promedioPeriodo.materia_curso.docente_id !== docente_id) {
      throw new ForbiddenException(
        'Solo el docente asignado a esta materia puede registrar supletorios'
      );
    }

    // Registrar nota supletorio
    promedioPeriodo.nota_supletorio = dto.nota_supletorio;

    if (dto.nota_supletorio === 7) {
      // ✅ APROBÓ EL SUPLETORIO
      promedioPeriodo.promedio_final = 7.0;
      promedioPeriodo.cualitativa_final = ConversionCualitativa.AA;
      promedioPeriodo.estado = EstadoPromedioAnual.APROBADO;
    } else {
      // ❌ NO APROBÓ EL SUPLETORIO (conserva promedio anual)
      promedioPeriodo.promedio_final = promedioPeriodo.promedio_anual;
      promedioPeriodo.cualitativa_final = promedioPeriodo.cualitativa_anual;
      promedioPeriodo.estado = EstadoPromedioAnual.REPROBADO;
    }

    return await this.promedioPeriodoRepository.save(promedioPeriodo);
  }

  /**
   * 👑 ADMIN: Listar todos los promedios anuales
   */
  async findAll() {
    return await this.promedioPeriodoRepository.find({
      order: {
        periodo_lectivo: { fechaInicio: 'DESC' },
        estudiante: { nombres_completos: 'ASC' }
      }
    });
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Obtener promedio anual específico
   */
  async findOne(id: string) {
    const promedio = await this.promedioPeriodoRepository.findOne({
      where: { id }
    });

    if (!promedio) {
      throw new NotFoundException('Promedio anual no encontrado');
    }

    return promedio;
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Listar promedios anuales de un estudiante (histórico)
   */
  async findByEstudiante(estudiante_id: string) {
    return await this.promedioPeriodoRepository.find({
      where: { estudiante_id },
      order: {
        periodo_lectivo: { fechaInicio: 'DESC' },
        materia_curso: { materia: { nombre: 'ASC' } }
      }
    });
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Listar promedios anuales por materia-curso y período
   */
  async findByMateriaCursoYPeriodo(materia_curso_id: string, periodo_lectivo_id: string) {
    return await this.promedioPeriodoRepository.find({
      where: { materia_curso_id, periodo_lectivo_id },
      order: {
        estudiante: { nombres_completos: 'ASC' }
      }
    });
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Listar promedios anuales por curso y período
   */
  async findByCursoYPeriodo(curso_id: string, periodo_lectivo_id: string) {
    return await this.promedioPeriodoRepository
      .createQueryBuilder('pp')
      .innerJoinAndSelect('pp.estudiante', 'est')
      .innerJoinAndSelect('pp.materia_curso', 'mc')
      .innerJoinAndSelect('mc.materia', 'mat')
      .innerJoinAndSelect('pp.periodo_lectivo', 'pl')
      .where('mc.curso_id = :curso_id', { curso_id })
      .andWhere('pp.periodo_lectivo_id = :periodo_lectivo_id', { periodo_lectivo_id })
      .orderBy('est.nombres_completos', 'ASC')
      .addOrderBy('mat.nombre', 'ASC')
      .getMany();
  }

  /**
   * 🎓 DOCENTE + 👑 ADMIN: Estudiantes que necesitan rendir supletorio en una materia-curso
   */
  async estudiantesEnSupletorio(materia_curso_id: string, periodo_lectivo_id: string) {
    return await this.promedioPeriodoRepository
      .createQueryBuilder('pp')
      .leftJoinAndSelect('pp.estudiante', 'estudiante')
      .leftJoinAndSelect('pp.materia_curso', 'materia_curso')
      .leftJoinAndSelect('materia_curso.materia', 'materia')
      .leftJoinAndSelect('pp.periodo_lectivo', 'periodo_lectivo')
      .where('pp.materia_curso_id = :materia_curso_id', { materia_curso_id })
      .andWhere('pp.periodo_lectivo_id = :periodo_lectivo_id', { periodo_lectivo_id })
      .andWhere('pp.promedio_anual >= :min_promedio', { min_promedio: 5.0 })
      .andWhere('pp.promedio_anual < :max_promedio', { max_promedio: 7.0 })
      .orderBy('estudiante.nombres_completos', 'ASC')
      .getMany();
  }

  /**
   * 🎓 TUTOR + 👑 ADMIN: Todos los estudiantes en supletorio de un período
   */
  async todosEstudiantesEnSupletorioPorPeriodo(periodo_lectivo_id: string) {
    return await this.promedioPeriodoRepository
      .createQueryBuilder('pp')
      .leftJoinAndSelect('pp.estudiante', 'estudiante')
      .leftJoinAndSelect('pp.materia_curso', 'materia_curso')
      .leftJoinAndSelect('materia_curso.materia', 'materia')
      .leftJoinAndSelect('pp.periodo_lectivo', 'periodo_lectivo')
      .where('pp.periodo_lectivo_id = :periodo_lectivo_id', { periodo_lectivo_id })
      .andWhere('pp.promedio_anual >= :min_promedio', { min_promedio: 5.0 })
      .andWhere('pp.promedio_anual < :max_promedio', { max_promedio: 7.0 })
      .orderBy('estudiante.nombres_completos', 'ASC')
      .addOrderBy('materia.nombre', 'ASC')
      .getMany();
  }

  /**
   * 👑 ADMIN: Actualizar observaciones
   */
  async update(id: string, updateDto: UpdatePromedioPeriodoDto) {
    const promedio = await this.findOne(id);

    if (updateDto.observaciones !== undefined) {
      promedio.observaciones = updateDto.observaciones;
    }

    return await this.promedioPeriodoRepository.save(promedio);
  }

  /**
   * 👑 ADMIN: Eliminar promedio anual (para recalcular después)
   */
  async remove(id: string) {
    const promedio = await this.findOne(id);
    await this.promedioPeriodoRepository.remove(promedio);
    return { message: 'Promedio anual eliminado exitosamente' };
  }

  /**
   * 👑 ADMIN: Recalcular promedio anual (eliminar + crear con datos actuales)
   */
  async recalcular(id: string) {
    const promedioAnterior = await this.findOne(id);

    const { estudiante_id, materia_curso_id, periodo_lectivo_id, observaciones } = promedioAnterior;

    await this.promedioPeriodoRepository.remove(promedioAnterior);

    return await this.create({
      estudiante_id,
      materia_curso_id,
      periodo_lectivo_id,
      observaciones
    });
  }

  /**
   * 👑 ADMIN: Limpiar datos de supletorio por período (cuando se regresa a PENDIENTE)
   */
  async limpiarDatosSupletorioPorPeriodo(periodo_lectivo_id: string) {
    const promedios = await this.promedioPeriodoRepository.find({
      where: {
        periodo_lectivo_id,
        estado: EstadoPromedioAnual.SUPLETORIO
      }
    });

    if (promedios.length === 0) {
      return {
        actualizados: 0,
        mensaje: 'No hay registros de supletorio para limpiar en este período'
      };
    }

    // Limpiar datos de supletorio y restaurar estado
    for (const promedio of promedios) {
      promedio.nota_supletorio = null;
      promedio.promedio_final = null;
      promedio.cualitativa_final = null;
      promedio.estado = EstadoPromedioAnual.SUPLETORIO; // Mantener en SUPLETORIO
    }

    await this.promedioPeriodoRepository.save(promedios);

    return {
      actualizados: promedios.length,
      mensaje: `${promedios.length} registros de supletorio limpiados correctamente`
    };
  }
}