import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCursoDto } from './dto/create-curso.dto';
import { UpdateCursoDto } from './dto/update-curso.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Curso, EstadoCurso, EspecialidadCurso, getNivelFromUrl, NivelCurso } from './entities/curso.entity';
import { PeriodosLectivosService } from '../periodos-lectivos/periodos-lectivos.service';
import { TrimestresService } from '../trimestres/trimestres.service';
import { DocentesService } from '../docentes/docentes.service';
import { EstadoPeriodo } from '../periodos-lectivos/entities/periodos-lectivo.entity';
import { Estado } from '../usuarios/entities/usuario.entity'
import { MateriaCursoService } from '../materia-curso/materia-curso.service';

@Injectable()
export class CursosService {
  constructor(
    @InjectRepository(Curso)
    private readonly cursoRepository: Repository<Curso>,
    private readonly periodosLectivosService: PeriodosLectivosService,
    private readonly trimestresService: TrimestresService,
    private readonly docentesService: DocentesService,
    private readonly materiaCursoService: MateriaCursoService,
  ) { }

  // 👑 ADMIN: Crear curso
  async create(createCursoDto: CreateCursoDto) {
    const periodo = await this.periodosLectivosService.findOne(createCursoDto.periodo_lectivo_id);

    if (periodo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException('Solo se pueden crear cursos en períodos lectivos activos');
    }

    const trimestres = await this.trimestresService.findTrimestresByPeriodo(createCursoDto.periodo_lectivo_id);
    const trimestresFinalizados = trimestres.filter(t => t.estado === 'FINALIZADO');

    if (trimestresFinalizados.length > 0) {
      throw new BadRequestException(
        `No se pueden crear cursos cuando ya hay ${trimestresFinalizados.length} trimestre(s) finalizado(s). ` +
        `Los cursos deben crearse al inicio del período lectivo.`
      );
    }

    const cursoExistente = await this.cursoRepository.findOne({
      where: {
        nivel: createCursoDto.nivel,
        paralelo: createCursoDto.paralelo.toUpperCase(),
        especialidad: createCursoDto.especialidad,
        periodo_lectivo_id: createCursoDto.periodo_lectivo_id
      }
    });

    if (cursoExistente) {
      throw new ConflictException(
        `Ya existe el curso ${createCursoDto.nivel} ${createCursoDto.paralelo} ` +
        `de ${createCursoDto.especialidad} para este período lectivo`
      );
    }

    const { nivel, especialidad } = createCursoDto;

    // Básica: solo BASICA
    const nivelesBasicos = [NivelCurso.OCTAVO, NivelCurso.NOVENO, NivelCurso.DECIMO];
    if (nivelesBasicos.includes(nivel) && especialidad !== EspecialidadCurso.BASICA) {
      throw new BadRequestException(
        `Los niveles ${nivel} solo pueden tener especialidad BÁSICA`
      );
    }

    // Bachillerato: no puede ser BASICA
    const nivelesBachillerato = [
      NivelCurso.PRIMERO_BACHILLERATO,
      NivelCurso.SEGUNDO_BACHILLERATO,
      NivelCurso.TERCERO_BACHILLERATO
    ];
    if (nivelesBachillerato.includes(nivel) && especialidad === EspecialidadCurso.BASICA) {
      throw new BadRequestException(
        `Los niveles de bachillerato (${nivel}) deben tener especialidad TÉCNICO o CIENCIAS`
      );
    }

    const paraleloNuevo = createCursoDto.paralelo.toUpperCase();

    // Obtener paralelos existentes para este nivel y especialidad
    const paralelosExistentes = await this.cursoRepository.find({
      where: {
        nivel: createCursoDto.nivel,
        especialidad: createCursoDto.especialidad,
        periodo_lectivo_id: createCursoDto.periodo_lectivo_id
      },
      select: ['paralelo'],
      order: { paralelo: 'ASC' }
    });

    if (paralelosExistentes.length > 0) {
      const paralelos = paralelosExistentes.map(p => p.paralelo).sort();
      const ultimoParalelo = paralelos[paralelos.length - 1];
      const siguienteParaleloEsperado = String.fromCharCode(ultimoParalelo.charCodeAt(0) + 1);

      if (paraleloNuevo !== siguienteParaleloEsperado) {
        throw new BadRequestException(
          `El próximo paralelo para ${createCursoDto.nivel} ${createCursoDto.especialidad} debe ser "${siguienteParaleloEsperado}". ` +
          `Paralelos existentes: ${paralelos.join(', ')}`
        );
      }
    } else {
      // Primer paralelo debe ser 'A'
      if (paraleloNuevo !== 'A') {
        throw new BadRequestException(
          `El primer paralelo debe ser "A" para ${createCursoDto.nivel} ${createCursoDto.especialidad}`
        );
      }
    }

    // 🆕 VALIDAR DOCENTE SI SE PROPORCIONA
    if (createCursoDto.docente_id) {
      const docente = await this.docentesService.findOne(createCursoDto.docente_id);

      if (docente.usuario_id.estado !== Estado.ACTIVO) {
        throw new BadRequestException('Solo se pueden asignar docentes activos como tutores');
      }

      // Validar que el docente no sea tutor de otro curso en el mismo período
      const docenteOcupado = await this.cursoRepository.findOne({
        where: {
          docente_id: createCursoDto.docente_id,
          periodo_lectivo_id: createCursoDto.periodo_lectivo_id
        },
        relations: ['docente']
      });

      if (docenteOcupado) {
        throw new ConflictException(
          `El docente ${docente.nombres} ${docente.apellidos} ya es tutor del curso ` +
          `${docenteOcupado.nivel} ${docenteOcupado.paralelo} en este período lectivo`
        );
      }
    }

    const curso = this.cursoRepository.create({
      ...createCursoDto,
      paralelo: createCursoDto.paralelo.toUpperCase()
    });

    const nuevoCurso = await this.cursoRepository.save(curso);

    return {
      message: `Curso ${nuevoCurso.nivel} ${nuevoCurso.paralelo} de ${nuevoCurso.especialidad} creado exitosamente`,
      curso: nuevoCurso
    }
  }

  // 👑 ADMIN: Listar todos los cursos del período activo
  async findAll() {
    try {
      const periodoActivo = await this.periodosLectivosService.findActivo();

      return await this.cursoRepository.find({
        where: { periodo_lectivo_id: periodoActivo.id },
        order: { nivel: 'ASC', paralelo: 'ASC' },
        relations: ['docente']
      });
    } catch (error) {
      return [];
    }
  }

  // 👑 ADMIN: Cursos por período específico
  async findByPeriodo(id: string) {
    return await this.cursoRepository.find({
      where: { periodo_lectivo_id: id },
      order: { nivel: 'ASC', paralelo: 'ASC' }
    });
  }

  // 👑 ADMIN: Cursos por nivel
  async findByNivel(nivelUrl: string) {
    const nivel = getNivelFromUrl(nivelUrl);

    if (!nivel) {
      throw new BadRequestException(
        `Nivel no válido. Opciones: octavo, noveno, decimo, primero-bachillerato, segundo-bachillerato, tercero-bachillerato`
      );
    }

    const periodoActivo = await this.periodosLectivosService.findActivo();

    return await this.cursoRepository.find({
      where: {
        nivel: nivel,
        periodo_lectivo_id: periodoActivo.id,
        estado: EstadoCurso.ACTIVO
      },
      order: { paralelo: 'ASC' }
    });
  }

  // 👑 ADMIN: Curso específico
  async findOne(id: string) {
    const curso = await this.cursoRepository.findOne({
      where: { id },
      relations: ['periodo_lectivo', 'docente']
    });

    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }

    return curso;
  }

  // 👑 ADMIN: Actualizar curso
  async update(id: string, updateCursoDto: UpdateCursoDto) {
    const curso = await this.findOne(id);

    // Validar que el período del curso esté activo
    if (curso.periodo_lectivo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException('No se pueden modificar cursos de períodos lectivos finalizados');
    }

    // 🆕 GUARDAR EL TUTOR ANTERIOR
    const tutorAnterior = curso.docente_id;

    // VALIDAR DOCENTE SI SE ESTÁ ACTUALIZANDO
    if (updateCursoDto.docente_id !== undefined) {
      if (updateCursoDto.docente_id) {
        const docente = await this.docentesService.findOne(updateCursoDto.docente_id);

        if (docente.usuario_id.estado !== Estado.ACTIVO) {
          throw new BadRequestException('Solo se pueden asignar docentes activos como tutores');
        }

        // Validar que el docente no sea tutor de otro curso en el mismo período
        const docenteOcupado = await this.cursoRepository.findOne({
          where: {
            docente_id: updateCursoDto.docente_id,
            periodo_lectivo_id: curso.periodo_lectivo_id,
            id: Not(id)
          },
          relations: ['docente']
        });

        if (docenteOcupado) {
          throw new ConflictException(
            `El docente ${docente.nombres} ${docente.apellidos} ya es tutor del curso ` +
            `${docenteOcupado.nivel} ${docenteOcupado.paralelo} en este período lectivo`
          );
        }
      }
    }

    // Validar unicidad si se cambia nivel/paralelo/especialidad
    if (updateCursoDto.nivel || updateCursoDto.paralelo || updateCursoDto.especialidad) {
      const nuevoNivel = updateCursoDto.nivel || curso.nivel;
      const nuevoParalelo = (updateCursoDto.paralelo || curso.paralelo).toUpperCase();
      const nuevaEspecialidad = updateCursoDto.especialidad || curso.especialidad;

      const cursoExistente = await this.cursoRepository.findOne({
        where: {
          nivel: nuevoNivel,
          paralelo: nuevoParalelo,
          especialidad: nuevaEspecialidad,
          periodo_lectivo_id: curso.periodo_lectivo_id,
          id: Not(id)
        }
      });

      if (cursoExistente) {
        throw new ConflictException(
          `Ya existe otro curso ${nuevoNivel} ${nuevoParalelo} de ${nuevaEspecialidad} para este período`
        );
      }
    }

    // Normalizar paralelo
    if (updateCursoDto.paralelo) {
      updateCursoDto.paralelo = updateCursoDto.paralelo.toUpperCase();
    }

    // Actualizar curso
    await this.cursoRepository.update(id, updateCursoDto);

    // 🆕 GESTIONAR COMPONENTES CUALITATIVOS AL CAMBIAR TUTOR
    if (updateCursoDto.docente_id !== undefined && updateCursoDto.docente_id !== tutorAnterior) {

      // CASO 1: Se asigna un tutor por primera vez (antes era null)
      if (!tutorAnterior && updateCursoDto.docente_id) {
        await this.materiaCursoService.asignarComponentesCualitativosTutor(
          id,
          updateCursoDto.docente_id
        );
      }

      // CASO 2: Se cambia de tutor (había uno antes y ahora es otro)
      else if (tutorAnterior && updateCursoDto.docente_id) {
        await this.materiaCursoService.reasignarComponentesCualitativosANuevoTutor(
          id,
          updateCursoDto.docente_id
        );
      }

      // CASO 3: Se REMUEVE el tutor (pasa a null) - NO hacemos nada
      // ⚠️ Las calificaciones ya registradas se mantienen
    }

    const cursoActualizado = await this.findOne(id);

    return {
      message: 'Curso actualizado exitosamente',
      curso: cursoActualizado,
    };
  }

  // 👑 ADMIN: Cambiar estado del curso
  async cambiarEstado(id: string) {
    const curso = await this.findOne(id);

    // Validar que el período del curso esté activo
    if (curso.periodo_lectivo.estado !== 'ACTIVO') {
      throw new BadRequestException('No se puede cambiar el estado de cursos de períodos lectivos finalizados');
    }

    const nuevoEstado = curso.estado === EstadoCurso.ACTIVO ? EstadoCurso.INACTIVO : EstadoCurso.ACTIVO;

    await this.cursoRepository.update(id, { estado: nuevoEstado });

    return {
      message: `Curso ${nuevoEstado === EstadoCurso.ACTIVO ? 'activado' : 'desactivado'} exitosamente`,
      curso: {
        id: curso.id,
        nivel: curso.nivel,
        paralelo: curso.paralelo,
        especialidad: curso.especialidad,
        estado_anterior: curso.estado,
        estado_nuevo: nuevoEstado
      }
    };
  }

  async actualizarContadorEstudiantes(cursoId: string, cantidad: number): Promise<void> {
    await this.cursoRepository.update(cursoId, {
      estudiantes_matriculados: cantidad
    });
  }
}
