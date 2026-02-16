// nest-backend/src/materia-curso/materia-curso.service.ts
import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMateriaCursoDto } from './dto/create-materia-curso.dto';
import { UpdateMateriaCursoDto } from './dto/update-materia-curso.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoMateriaCurso, MateriaCurso } from './entities/materia-curso.entity';

import { MateriasService } from '../materias/materias.service';
import { CursosService } from '../cursos/cursos.service';
import { DocentesService } from '../docentes/docentes.service';
import { PeriodosLectivosService } from '../periodos-lectivos/periodos-lectivos.service';

import { EstadoPeriodo } from '../periodos-lectivos/entities/periodos-lectivo.entity';
import { EstadoMateria, NivelEducativo, TipoCalificacion } from '../materias/entities/materia.entity';
import { Estado } from '../usuarios/entities/usuario.entity';
import { NivelCurso } from '../cursos/entities/curso.entity';
import { NivelAsignado } from '../docentes/entities/docente.entity';

@Injectable()
export class MateriaCursoService {
  constructor(
    @InjectRepository(MateriaCurso)
    private readonly materiaCursoRepository: Repository<MateriaCurso>,
    private readonly materiasService: MateriasService,
    private readonly docentesService: DocentesService,
    private readonly periodosLectivosService: PeriodosLectivosService,
    @Inject(forwardRef(() => CursosService))
    private readonly cursosService: CursosService
  ) { }

  async create(createMateriaCursoDto: CreateMateriaCursoDto) {
    const curso = await this.cursosService.findOne(createMateriaCursoDto.curso_id);
    const materia = await this.materiasService.findOne(createMateriaCursoDto.materia_id);
    const periodoLectivo = await this.periodosLectivosService.findOne(
      createMateriaCursoDto.periodo_lectivo_id
    );

    // Validar período activo
    if (periodoLectivo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException(
        'No se pueden asignar materias a cursos en un periodo lectivo que no está activo.'
      );
    }

    // Validar que el curso pertenece al período
    if (String(curso.periodo_lectivo_id) !== createMateriaCursoDto.periodo_lectivo_id) {
      throw new BadRequestException('El curso no pertenece al periodo lectivo especificado.');
    }

    // Validar materia activa
    if (materia.estado !== EstadoMateria.ACTIVO) {
      throw new BadRequestException('No se puede asignar una materia que no está activa.');
    }

    // Determinar si es básica o bachillerato
    const nivelesBasicos = [NivelCurso.OCTAVO, NivelCurso.NOVENO, NivelCurso.DECIMO];
    const esBasica = nivelesBasicos.includes(curso.nivel);

    // Validar compatibilidad materia-curso (solo para no-GENERAL)
    if (materia.nivelEducativo !== NivelEducativo.GENERAL) {
      if (materia.nivelEducativo === NivelEducativo.BASICA && !esBasica) {
        throw new BadRequestException(
          `La materia "${materia.nombre}" es solo para Educación Básica, ` +
          `pero el curso ${curso.nivel} ${curso.paralelo} es de Bachillerato`
        );
      }

      if (materia.nivelEducativo === NivelEducativo.BACHILLERATO && esBasica) {
        throw new BadRequestException(
          `La materia "${materia.nombre}" es solo para Bachillerato, ` +
          `pero el curso ${curso.nivel} ${curso.paralelo} es de Educación Básica`
        );
      }
    }

    // Validar que no exista ya
    const existe = await this.materiaCursoRepository.findOne({
      where: {
        curso_id: createMateriaCursoDto.curso_id,
        materia_id: createMateriaCursoDto.materia_id,
        periodo_lectivo_id: createMateriaCursoDto.periodo_lectivo_id,
      },
    });

    if (existe) {
      throw new BadRequestException(
        'La materia ya existe en el curso para el periodo lectivo especificado.'
      );
    }

    // Validar docente si se proporciona
    if (createMateriaCursoDto.docente_id) {
      const docente = await this.docentesService.findOne(createMateriaCursoDto.docente_id);

      if (docente.usuario_id.estado !== Estado.ACTIVO) {
        throw new BadRequestException('No se puede asignar un docente que no está activo.');
      }

      // Validar nivel del docente
      if (docente.nivelAsignado === NivelAsignado.BASICA && !esBasica) {
        throw new BadRequestException(
          `El docente ${docente.nombres} ${docente.apellidos} solo puede enseñar en Educación Básica`
        );
      }

      if (docente.nivelAsignado === NivelAsignado.BACHILLERATO && esBasica) {
        throw new BadRequestException(
          `El docente ${docente.nombres} ${docente.apellidos} solo puede enseñar en Bachillerato`
        );
      }
    }

    const materiaCurso = this.materiaCursoRepository.create(createMateriaCursoDto);
    const savedMateriaCurso = await this.materiaCursoRepository.save(materiaCurso);

    return savedMateriaCurso;
  }

  async findAll() {
    const materiasCursos = await this.materiaCursoRepository.find({
      order: { createdAt: 'DESC' },
    });

    if (materiasCursos.length === 0) {
      throw new BadRequestException('No hay materias asignadas a cursos');
    }

    return materiasCursos;
  }

  async findOne(id: string, docente_id?: string) {
    const materiaCurso = await this.materiaCursoRepository.findOne({
      where: { id },
      relations: ['curso', 'curso.periodo_lectivo', 'materia', 'docente']
    });

    if (!materiaCurso) {
      throw new NotFoundException('Materia-Curso no encontrada');
    }

    // Si es docente (no admin), validar que sea su materia
    if (docente_id && materiaCurso.docente_id !== docente_id) {
      throw new ForbiddenException('No tienes acceso a esta materia');
    }

    return materiaCurso;
  }

  async findByCurso(curso_id: string) {
    const curso = await this.cursosService.findOne(curso_id);

    if (!curso) {
      throw new BadRequestException('El curso no existe');
    }

    const materias = await this.materiaCursoRepository.find({
      where: { curso_id: curso_id },
      order: {
        materia: { createdAt: 'ASC' },
      },
    });

    return {
      curso: {
        id: curso.id,
        nivel: curso.nivel,
        paralelo: curso.paralelo,
        especialidad: curso.especialidad,
        periodo: curso.periodo_lectivo.nombre,
      },
      totalMaterias: materias.length,
      materiasActivas: materias.filter((m) => m.estado === EstadoMateriaCurso.ACTIVO).length,
      materias,
    };
  }

  async findByDocente(docente_id: string) {
    const docente = await this.docentesService.findOne(docente_id);

    if (!docente) {
      throw new BadRequestException('El docente no existe');
    }

    // 🆕 BUSCAR PERÍODO ACTIVO (sin lanzar error si no existe)
    let periodoActivo;
    try {
      periodoActivo = await this.periodosLectivosService.findActivo();
    } catch (error) {
      // Si no hay período activo, retornar respuesta vacía
      return {
        docente: {
          id: docente.id,
          nombres: docente.nombres,
          apellidos: docente.apellidos,
        },
        periodo: null,
        totalMaterias: 0,
        materiasActivas: 0,
        materias: [],
      };
    }

    const materias = await this.materiaCursoRepository.find({
      where: {
        docente_id: docente_id,
        periodo_lectivo_id: periodoActivo.id
      },
      order: {
        curso: {
          nivel: 'ASC',
          paralelo: 'ASC',
        },
      },
    });

    return {
      docente: {
        id: docente.id,
        nombres: docente.nombres,
        apellidos: docente.apellidos,
      },
      periodo: {
        id: periodoActivo.id,
        nombre: periodoActivo.nombre
      },
      totalMaterias: materias.length,
      materiasActivas: materias.filter((m) => m.estado === EstadoMateriaCurso.ACTIVO).length,
      materias,
    };
  }

  async findByMateria(materia_id: string) {
    const materia = await this.materiasService.findOne(materia_id);

    if (!materia) {
      throw new BadRequestException('La materia no existe');
    }

    const cursos = await this.materiaCursoRepository.find({
      where: { materia_id: materia_id },
      order: {
        curso: {
          nivel: 'ASC',
          paralelo: 'ASC',
        },
      },
    });

    return {
      materia: {
        id: materia.id,
        nombre: materia.nombre,
        nivelEducativo: materia.nivelEducativo,
      },
      totalCursos: cursos.length,
      cursosActivos: cursos.filter((c) => c.estado === EstadoMateriaCurso.ACTIVO).length,
      cursos,
    };
  }

  async findByPeriodoLectivo(periodo_lectivo_id: string) {
    const periodo = await this.periodosLectivosService.findOne(periodo_lectivo_id);

    if (!periodo) {
      throw new BadRequestException('El periodo lectivo no existe');
    }

    const materiasCursos = await this.materiaCursoRepository.find({
      where: { periodo_lectivo_id: periodo_lectivo_id },
      order: {
        curso: {
          nivel: 'ASC',
          paralelo: 'ASC',
        },
        materia: {
          nombre: 'ASC',
        },
      },
    });

    return {
      periodo: {
        id: periodo.id,
        nombre: periodo.nombre,
        estado: periodo.estado,
      },
      totalAsignaciones: materiasCursos.length,
      asignacionesActivas: materiasCursos.filter(
        (mc) => mc.estado === EstadoMateriaCurso.ACTIVO
      ).length,
      materiasCursos,
    };
  }

  // 🆕 Encontrar materias asignadas a un nivel específico (para mostrar en UI)
  async findByNivelYPeriodo(nivel: NivelCurso, especialidad: string, periodo_lectivo_id: string) {
    const materiasCursos = await this.materiaCursoRepository.find({
      where: {
        periodo_lectivo_id,
      },
      relations: ['curso', 'materia', 'docente'],
    });

    // Filtrar por nivel y especialidad
    const filtradas = materiasCursos.filter((mc) => {
      if (mc.curso.nivel !== nivel) return false;
      if (especialidad && mc.curso.especialidad !== especialidad) return false;
      return true;
    });

    // Agrupar por materia
    const materiasAgrupadas = new Map();

    filtradas.forEach((mc) => {
      const materiaId = mc.materia.id;
      if (!materiasAgrupadas.has(materiaId)) {
        materiasAgrupadas.set(materiaId, {
          materia: mc.materia,
          cursosAsignados: [],
          totalParalelos: 0,
          paralelosConDocente: 0,
        });
      }

      const grupo = materiasAgrupadas.get(materiaId);
      grupo.cursosAsignados.push({
        curso: mc.curso,
        docente: mc.docente,
        estado: mc.estado,
      });
      grupo.totalParalelos++;
      if (mc.docente_id) {
        grupo.paralelosConDocente++;
      }
    });

    return Array.from(materiasAgrupadas.values());
  }

  async update(id: string, updateMateriaCursoDto: UpdateMateriaCursoDto) {
    const materiaCurso = await this.findOne(id);

    if (materiaCurso.periodo_lectivo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException(
        'No se pueden modificar asignaciones en un periodo lectivo que no está activo.'
      );
    }

    // ✅ Ahora solo validar si hay un ID (sin conversiones)
    if (updateMateriaCursoDto.docente_id) {
      const docente = await this.docentesService.findOne(updateMateriaCursoDto.docente_id);

      if (docente.usuario_id.estado !== Estado.ACTIVO) {
        throw new BadRequestException('No se puede asignar un docente que no está activo.');
      }

      const nivelesBasicos = [NivelCurso.OCTAVO, NivelCurso.NOVENO, NivelCurso.DECIMO];
      const esBasica = nivelesBasicos.includes(materiaCurso.curso.nivel);

      if (docente.nivelAsignado === NivelAsignado.BASICA && !esBasica) {
        throw new BadRequestException(
          `El docente ${docente.nombres} ${docente.apellidos} solo puede enseñar en Educación Básica`
        );
      }

      if (docente.nivelAsignado === NivelAsignado.BACHILLERATO && esBasica) {
        throw new BadRequestException(
          `El docente ${docente.nombres} ${docente.apellidos} solo puede enseñar en Bachillerato`
        );
      }
    }

    await this.materiaCursoRepository.update(id, updateMateriaCursoDto);

    const updatedMateriaCurso = await this.findOne(id);

    return updatedMateriaCurso;
  }

  async remove(id: string) {
    const materiaCurso = await this.findOne(id);

    if (materiaCurso.periodo_lectivo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException('No se pueden eliminar asignaciones de períodos finalizados');
    }

    await this.materiaCursoRepository.delete(id);

    return {
      message:
        `Materia "${materiaCurso.materia.nombre}" eliminada del curso ` +
        `${materiaCurso.curso.nivel} ${materiaCurso.curso.paralelo}`,
    };
  }

  // 🆕 Eliminar materia de todos los paralelos de un nivel
  async removeFromNivel(
    materia_id: string,
    nivel: NivelCurso,
    especialidad: string,
    periodo_lectivo_id: string
  ) {
    const materiasCursos = await this.materiaCursoRepository.find({
      where: { materia_id, periodo_lectivo_id },
      relations: ['curso', 'materia', 'periodo_lectivo'],
    });

    // Validar período activo
    if (materiasCursos.length > 0 && materiasCursos[0].periodo_lectivo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException('No se pueden eliminar asignaciones de períodos finalizados');
    }

    // Filtrar por nivel y especialidad
    const paraEliminar = materiasCursos.filter((mc) => {
      if (mc.curso.nivel !== nivel) return false;
      if (especialidad && mc.curso.especialidad !== especialidad) return false;
      return true;
    });

    if (paraEliminar.length === 0) {
      throw new BadRequestException('No se encontraron asignaciones para eliminar');
    }

    // Eliminar todos
    await this.materiaCursoRepository.remove(paraEliminar);

    const materia = paraEliminar[0].materia;
    return {
      message: `Materia "${materia.nombre}" eliminada de ${paraEliminar.length} paralelo(s)`,
      eliminados: paraEliminar.length,
    };
  }


  /**
   * 🆕 AUTO-ASIGNAR COMPONENTES CUALITATIVOS AL TUTOR
   * Se ejecuta automáticamente cuando se asigna un tutor a un curso
   */
  async asignarComponentesCualitativosTutor(
    curso_id: string,
    docente_id: string
  ): Promise<void> {
    const curso = await this.cursosService.findOne(curso_id);

    // Determinar nivel educativo
    const nivelesBasicos = [NivelCurso.OCTAVO, NivelCurso.NOVENO, NivelCurso.DECIMO];
    const esBasica = nivelesBasicos.includes(curso.nivel);
    const nivelEducativo = esBasica ? NivelEducativo.BASICA : NivelEducativo.BACHILLERATO;

    // Obtener todas las materias cualitativas del nivel
    const todasMaterias = await this.materiasService.findAll();
    const componentesCualitativos = todasMaterias.filter(
      m =>
        m.tipoCalificacion === TipoCalificacion.CUALITATIVA && // ✅ Usar enum correcto
        m.estado === EstadoMateria.ACTIVO &&
        (m.nivelEducativo === nivelEducativo || m.nivelEducativo === NivelEducativo.GENERAL)
    );

    // Crear MateriaCurso para cada componente cualitativo
    for (const materia of componentesCualitativos) {
      // Verificar si ya existe
      const existe = await this.materiaCursoRepository.findOne({
        where: {
          curso_id,
          materia_id: materia.id,
          periodo_lectivo_id: curso.periodo_lectivo_id,
        },
      });

      if (!existe) {
        // Crear nuevo registro con el tutor asignado
        const materiaCurso = this.materiaCursoRepository.create({
          curso_id,
          materia_id: materia.id,
          docente_id, // Asignar al tutor
          periodo_lectivo_id: curso.periodo_lectivo_id,
          estado: EstadoMateriaCurso.ACTIVO,
        });

        await this.materiaCursoRepository.save(materiaCurso);
      } else if (!existe.docente_id) {
        // Si existe pero no tiene docente, asignar al tutor
        existe.docente_id = docente_id;
        await this.materiaCursoRepository.save(existe);
      }
      // ⚠️ Si ya tiene un docente asignado, NO hacer nada (respeta calificaciones existentes)
    }
  }

  /**
   * 🆕 REASIGNAR COMPONENTES CUALITATIVOS AL NUEVO TUTOR
   * ⚠️ NO ELIMINA CALIFICACIONES, solo cambia la asignación del docente
   */
  async reasignarComponentesCualitativosANuevoTutor(
    curso_id: string,
    nuevo_tutor_id: string
  ): Promise<void> {
    // Obtener todos los MateriaCurso cualitativos del curso
    const materiaCursos = await this.materiaCursoRepository.find({
      where: { curso_id },
      relations: ['materia'],
    });

    const cualitativosDelCurso = materiaCursos.filter(
      mc => mc.materia.tipoCalificacion === TipoCalificacion.CUALITATIVA
    );

    // ✅ Solo REASIGNAR al nuevo tutor (NO borrar, NO afecta calificaciones)
    for (const mc of cualitativosDelCurso) {
      mc.docente_id = nuevo_tutor_id;
      await this.materiaCursoRepository.save(mc);
    }
  }
}