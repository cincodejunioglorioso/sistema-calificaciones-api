import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EstadoEstudiante, Estudiante } from './entities/estudiante.entity';
import { Repository, DataSource } from 'typeorm';
import { EstadoMatricula } from '../matriculas/entities/matricula.entity';
import { UpdateDatosPersonalesDto } from './dto/update-datos-personales.dto';

@Injectable()
export class EstudiantesService {

  constructor(
    @InjectRepository(Estudiante)
    private readonly estudianteRepository: Repository<Estudiante>,
    private readonly dataSource: DataSource,
  ) { }

  // ===================================
  // 📊 ESTADÍSTICAS
  // ===================================
  async getEstadisticas() {
    const [
      activos,
      sinMatricula,
      graduados,
      completos,
      incompletos
    ] = await Promise.all([
      this.estudianteRepository.count({ where: { estado: EstadoEstudiante.ACTIVO } }),
      this.estudianteRepository.count({ where: { estado: EstadoEstudiante.SIN_MATRICULA } }),
      this.estudianteRepository.count({ where: { estado: EstadoEstudiante.GRADUADO } }),
      this.estudianteRepository.count({ where: { datos_completos: true } }),
      this.estudianteRepository.count({ where: { datos_completos: false } }),
    ]);

    return {
      activos,
      sinMatricula,
      graduados,
      completos,
      incompletos,
    };
  }

  // ===================================
  // 🔍 BÚSQUEDA Y LISTADO
  // ===================================
  async findAll(
    estado?: EstadoEstudiante,
    incompletos?: boolean,
    search?: string,
    nivelCurso?: string,
    page = 1,
    limit = 20
  ) {
    // ✅ Query principal para contar total
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
        '(estudiante.nombres_completos ILIKE :search OR estudiante.estudiante_cedula ILIKE :search OR estudiante.estudiante_email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

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

    const total = await countQuery.getCount();

    if (total === 0) {
      return {
        data: [],
        total: 0,
        page,
        lastPage: 1,
      };
    }

    // ✅ Subquery para obtener IDs paginados y ordenados
    const subQuery = this.estudianteRepository
      .createQueryBuilder('e')
      .select('e.id');

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
        '(e.nombres_completos ILIKE :search OR e.estudiante_cedula ILIKE :search OR e.estudiante_email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

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

    subQuery
      .orderBy('e.nombres_completos', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

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

    // ✅ Query final con relaciones completas manteniendo el orden
    const data = await this.estudianteRepository
      .createQueryBuilder('estudiante')
      .leftJoinAndSelect('estudiante.matriculas', 'matriculas')
      .leftJoinAndSelect('matriculas.curso', 'curso')
      .leftJoinAndSelect('matriculas.periodo_lectivo', 'periodo_lectivo')
      .whereInIds(studentIds)
      .orderBy('estudiante.nombres_completos', 'ASC')
      .getMany();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findIncompletos(page = 1, limit = 20) {
    return this.findAll(EstadoEstudiante.ACTIVO, true, undefined, undefined, page, limit);
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

  async findByCedula(cedula: string): Promise<Estudiante | null> {
    return await this.estudianteRepository.findOne({
      where: { estudiante_cedula: cedula }
    });
  }

  // ===================================
  // ✏️ CREAR Y ACTUALIZAR
  // ===================================
  async findOrCreate(cedula: string, createEstudianteDto: CreateEstudianteDto): Promise<Estudiante> {
    let estudiante = await this.estudianteRepository.findOne({
      where: { estudiante_cedula: cedula }
    });

    if (!estudiante) {
      estudiante = await this.create(createEstudianteDto);
    } else {
      if (createEstudianteDto.nombres_completos && createEstudianteDto.nombres_completos !== estudiante.nombres_completos) {
        estudiante.nombres_completos = createEstudianteDto.nombres_completos;
      }

    // Actualizar email si cambió (permitir null/undefined para limpiar)
    if (createEstudianteDto.estudiante_email !== undefined) {
      estudiante.estudiante_email = createEstudianteDto.estudiante_email || undefined;
    }

    // Guardar cambios si hubo modificaciones
    estudiante = await this.estudianteRepository.save(estudiante);
  }

    return estudiante;
  }

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

  async actualizarDatosPersonales(
    id: string,
    updateDatosPersonalesDto: UpdateDatosPersonalesDto,
  ): Promise<Estudiante> {
    const estudiante = await this.findOne(id);

    // Actualizar solo campos permitidos (sin nombres, cédula, correo, ni estado)
    Object.assign(estudiante, updateDatosPersonalesDto);

    return await this.estudianteRepository.save(estudiante);
  }

  // ===================================
  // 🎯 ACCIONES DE ESTADO
  // ===================================
  async retirar(id: string, motivo?: string) {
    const estudiante = await this.findOne(id);

    if (estudiante.estado === EstadoEstudiante.RETIRADO) {
      throw new BadRequestException('El estudiante ya está retirado');
    }

    if (estudiante.estado === EstadoEstudiante.GRADUADO) {
      throw new BadRequestException('No se puede retirar un estudiante graduado');
    }

    const queryRunner = this.dataSource.createQueryRunner();
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
        estudiante: await this.findOne(id)
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
      estudiante: await this.findOne(id)
    };
  }

  async reactivar(id: string) {
    const estudiante = await this.findOne(id);

    if (estudiante.estado !== EstadoEstudiante.RETIRADO) {
      throw new BadRequestException('El estudiante no está retirado');
    }

    await this.estudianteRepository.update(id, {
      estado: EstadoEstudiante.SIN_MATRICULA
    });

    return await this.findOne(id);
  }
}