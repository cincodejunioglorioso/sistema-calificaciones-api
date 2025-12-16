import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoEstudiante, Estudiante } from './entities/estudiante.entity';
import { Repository, DataSource } from 'typeorm';
import { EstadoMatricula } from '../matriculas/entities/matricula.entity';

@Injectable()
export class EstudiantesService {

  constructor(
    @InjectRepository(Estudiante)
    private readonly estudianteRepository: Repository<Estudiante>,
    private readonly dataSource: DataSource,
  ) { }

  // ✅ Buscar estudiante por cédula o crear uno nuevo
  async findOrCreate(cedula: string, createEstudianteDto: CreateEstudianteDto): Promise<Estudiante> {
    let estudiante = await this.estudianteRepository.findOne({
      where: { estudiante_cedula: cedula }
    });

    if (!estudiante) {
      estudiante = await this.create(createEstudianteDto);
    }

    return estudiante;
  }

  // ✅ Crear estudiante (sin numero_de_matricula)
  async create(createEstudianteDto: CreateEstudianteDto): Promise<Estudiante> {
    const exists = await this.estudianteRepository.findOne({
      where: { estudiante_cedula: createEstudianteDto.estudiante_cedula },
    });

    if (exists) {
      throw new ConflictException('Estudiante con esta cédula ya existe');
    }

    const estudiante = this.estudianteRepository.create({
      ...createEstudianteDto,
      datos_completos: false,
      estado: EstadoEstudiante.SIN_MATRICULA
    });

    return await this.estudianteRepository.save(estudiante);
  }

  async findAll(
    estado?: EstadoEstudiante,
    incompletos?: boolean,
    search?: string,
    cursoId?: string,
    nivelCurso?: string,  // ✅ NUEVO: Filtrar por nivel
    periodoId?: string,
    page = 1,
    limit = 20
  ) {
    const query = this.estudianteRepository.createQueryBuilder('estudiante');

    // Cargar matrículas con sus relaciones
    query.leftJoinAndSelect('estudiante.matriculas', 'matriculas');
    query.leftJoinAndSelect('matriculas.curso', 'curso');
    query.leftJoinAndSelect('matriculas.periodo_lectivo', 'periodo_lectivo');

    if (estado) {
      query.andWhere('estudiante.estado = :estado', { estado });
    }

    if (incompletos !== undefined && incompletos !== null) {
      query.andWhere('estudiante.datos_completos = :datosCompletos', {
        datosCompletos: !incompletos
      });
    }

    if (search) {
      query.andWhere(
        `(estudiante.nombres_completos ILIKE :search OR
        estudiante.estudiante_cedula ILIKE :search OR
        estudiante.estudiante_email ILIKE :search)`,
        { search: `%${search}%` }
      );
    }

    // ✅ Filtro por curso específico (si se envía cursoId)
    if (cursoId) {
      query.andWhere(
        `EXISTS (
        SELECT 1 
        FROM matriculas m 
        WHERE m.estudiante_id = estudiante.id 
        AND m.curso_id = :cursoId 
        AND m.estado = :estadoMatriculaActivo
      )`
      );
      query.setParameter('cursoId', cursoId);
      query.setParameter('estadoMatriculaActivo', EstadoMatricula.ACTIVO);
    }

    // ✅ NUEVO: Filtro por NIVEL de curso (sin importar paralelo)
    if (nivelCurso) {
      query.andWhere(
        `EXISTS (
        SELECT 1 
        FROM matriculas m 
        INNER JOIN cursos c ON c.id = m.curso_id
        WHERE m.estudiante_id = estudiante.id 
        AND c.nivel = :nivelCurso 
        AND m.estado = :estadoMatriculaActivo
      )`
      );
      query.setParameter('nivelCurso', nivelCurso);
      query.setParameter('estadoMatriculaActivo', EstadoMatricula.ACTIVO);
    }

    if (periodoId) {
      query.andWhere(
        `EXISTS (
        SELECT 1 
        FROM matriculas m 
        WHERE m.estudiante_id = estudiante.id 
        AND m.periodo_lectivo_id = :periodoId
      )`
      );
      query.setParameter('periodoId', periodoId);
    }

    // ✅ Query separado para contar
    const countQuery = this.estudianteRepository.createQueryBuilder('estudiante');

    if (estado) {
      countQuery.andWhere('estudiante.estado = :estado', { estado });
    }

    if (incompletos !== undefined && incompletos !== null) {
      countQuery.andWhere('estudiante.datos_completos = :datosCompletos', {
        datosCompletos: !incompletos
      });
    }

    if (search) {
      countQuery.andWhere(
        `(estudiante.nombres_completos ILIKE :search OR
        estudiante.estudiante_cedula ILIKE :search OR
        estudiante.estudiante_email ILIKE :search)`,
        { search: `%${search}%` }
      );
    }

    if (cursoId) {
      countQuery.andWhere(
        `EXISTS (
        SELECT 1 
        FROM matriculas m 
        WHERE m.estudiante_id = estudiante.id 
        AND m.curso_id = :cursoId 
        AND m.estado = :estadoMatriculaActivo
      )`
      );
      countQuery.setParameter('cursoId', cursoId);
      countQuery.setParameter('estadoMatriculaActivo', EstadoMatricula.ACTIVO);
    }

    // ✅ NUEVO: Mismo filtro por nivel en count
    if (nivelCurso) {
      countQuery.andWhere(
        `EXISTS (
        SELECT 1 
        FROM matriculas m 
        INNER JOIN cursos c ON c.id = m.curso_id
        WHERE m.estudiante_id = estudiante.id 
        AND c.nivel = :nivelCurso 
        AND m.estado = :estadoMatriculaActivo
      )`
      );
      countQuery.setParameter('nivelCurso', nivelCurso);
      countQuery.setParameter('estadoMatriculaActivo', EstadoMatricula.ACTIVO);
    }

    if (periodoId) {
      countQuery.andWhere(
        `EXISTS (
        SELECT 1 
        FROM matriculas m 
        WHERE m.estudiante_id = estudiante.id 
        AND m.periodo_lectivo_id = :periodoId
      )`
      );
      countQuery.setParameter('periodoId', periodoId);
    }

    const total = await countQuery.getCount();

    // ✅ Subquery para ordenamiento
    const subQuery = this.estudianteRepository
      .createQueryBuilder('e')
      .select('e.id')
      .where('1=1');

    if (estado) {
      subQuery.andWhere('e.estado = :estado', { estado });
    }

    if (incompletos !== undefined && incompletos !== null) {
      subQuery.andWhere('e.datos_completos = :datosCompletos', {
        datosCompletos: !incompletos
      });
    }

    if (search) {
      subQuery.andWhere(
        `(e.nombres_completos ILIKE :search OR
        e.estudiante_cedula ILIKE :search OR
        e.estudiante_email ILIKE :search)`,
        { search: `%${search}%` }
      );
    }

    if (cursoId) {
      subQuery.andWhere(
        `EXISTS (
        SELECT 1 
        FROM matriculas m 
        WHERE m.estudiante_id = e.id 
        AND m.curso_id = :cursoId 
        AND m.estado = :estadoMatriculaActivo
      )`
      );
      subQuery.setParameter('cursoId', cursoId);
      subQuery.setParameter('estadoMatriculaActivo', EstadoMatricula.ACTIVO);
    }

    // ✅ NUEVO: Mismo filtro por nivel en subquery
    if (nivelCurso) {
      subQuery.andWhere(
        `EXISTS (
        SELECT 1 
        FROM matriculas m 
        INNER JOIN cursos c ON c.id = m.curso_id
        WHERE m.estudiante_id = e.id 
        AND c.nivel = :nivelCurso 
        AND m.estado = :estadoMatriculaActivo
      )`
      );
      subQuery.setParameter('nivelCurso', nivelCurso);
      subQuery.setParameter('estadoMatriculaActivo', EstadoMatricula.ACTIVO);
    }

    if (periodoId) {
      subQuery.andWhere(
        `EXISTS (
        SELECT 1 
        FROM matriculas m 
        WHERE m.estudiante_id = e.id 
        AND m.periodo_lectivo_id = :periodoId
      )`
      );
      subQuery.setParameter('periodoId', periodoId);
    }

    subQuery.orderBy('e.nombres_completos', 'ASC');
    subQuery.skip((page - 1) * limit).take(limit);

    const ids = await subQuery.getRawMany();
    const studentIds = ids.map(item => item.e_id);

    if (studentIds.length === 0) {
      return {
        data: [],
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    }

    const data = await this.estudianteRepository
      .createQueryBuilder('estudiante')
      .leftJoinAndSelect('estudiante.matriculas', 'matriculas')
      .leftJoinAndSelect('matriculas.curso', 'curso')
      .leftJoinAndSelect('matriculas.periodo_lectivo', 'periodo_lectivo')
      .where('estudiante.id IN (:...ids)', { ids: studentIds })
      .orderBy(`array_position(ARRAY[${studentIds.map((_, i) => `$${i + 1}`).join(',')}]::uuid[], estudiante.id)`)
      .setParameters(studentIds)
      .getMany();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }


  async findIncompletos(page = 1, limit = 20) {
    return this.findAll(EstadoEstudiante.ACTIVO, true, undefined, undefined, undefined, undefined, +page, +limit);
  }

  async findOne(id: string): Promise<Estudiante> {
    const estudiante = await this.estudianteRepository.findOne({
      where: { id },
      relations: ['matriculas', 'matriculas.curso', 'matriculas.periodo_lectivo']
    });

    if (!estudiante) {
      throw new NotFoundException(`Estudiante con ID ${id} no encontrado`);
    }

    return estudiante;
  }

  // ✅ Buscar por cédula (usado en matrículas)
  async findByCedula(cedula: string): Promise<Estudiante | null> {
    return await this.estudianteRepository.findOne({
      where: { estudiante_cedula: cedula }
    });
  }

  async update(id: string, updateEstudianteDto: UpdateEstudianteDto): Promise<Estudiante> {
    const estudiante = await this.findOne(id);

    // Si se está actualizando la cédula, validar que no exista
    if (updateEstudianteDto.estudiante_cedula &&
      updateEstudianteDto.estudiante_cedula !== estudiante.estudiante_cedula) {
      const existente = await this.estudianteRepository.findOne({
        where: { estudiante_cedula: updateEstudianteDto.estudiante_cedula }
      });

      if (existente) {
        throw new ConflictException(
          `Ya existe un estudiante con cédula ${updateEstudianteDto.estudiante_cedula}`
        );
      }
    }

    Object.assign(estudiante, updateEstudianteDto);

    return await this.estudianteRepository.save(estudiante);
  }

  async retirar(id: string, motivo?: string) {
    const estudiante = await this.findOne(id);

    if (estudiante.estado === EstadoEstudiante.RETIRADO) {
      throw new BadRequestException('El estudiante ya está retirado');
    }

    if (estudiante.estado === EstadoEstudiante.GRADUADO) {
      throw new BadRequestException('No se puede retirar un estudiante graduado');
    }

    const queryRunner = this.estudianteRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Cambiar estado del estudiante
      estudiante.estado = EstadoEstudiante.RETIRADO;
      await queryRunner.manager.save(estudiante);

      // 2. Retirar solo las matrículas ACTIVAS (no tocar las FINALIZADAS)
      await queryRunner.manager
        .createQueryBuilder()
        .update('matriculas')
        .set({
          estado: EstadoMatricula.RETIRADO,
          fecha_retiro: new Date(),
          observaciones: motivo || 'Estudiante retirado'
        })
        .where('estudiante_id = :estudianteId', { estudianteId: id })
        .andWhere('estado = :estadoActivo', { estadoActivo: EstadoMatricula.ACTIVO })
        .execute();

      await queryRunner.commitTransaction();

      return {
        message: `Estudiante ${estudiante.nombres_completos} retirado exitosamente`,
        estudiante
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async graduar(id: string) {
    const estudiante = await this.findOne(id);

    if (estudiante.estado === EstadoEstudiante.GRADUADO) {
      throw new BadRequestException('El estudiante ya está graduado');
    }

    if (estudiante.estado === EstadoEstudiante.RETIRADO) {
      throw new BadRequestException('No se puede graduar un estudiante retirado');
    }

    estudiante.estado = EstadoEstudiante.GRADUADO;
    await this.estudianteRepository.save(estudiante);

    return {
      message: `¡Felicitaciones! ${estudiante.nombres_completos} se ha graduado`,
      estudiante
    };
  }

  async reactivar(id: string) {
    const estudiante = await this.findOne(id);

    if (!estudiante) {
      throw new NotFoundException(`Estudiante con ID ${id} no encontrado`);
    }

    if (estudiante.estado !== EstadoEstudiante.RETIRADO) {
      throw new BadRequestException('El estudiante no esta retirado');
    }

    await this.estudianteRepository.update(id, {
      estado: EstadoEstudiante.SIN_MATRICULA
    });

    return await this.findOne(id);
  }
}