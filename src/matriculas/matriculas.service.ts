import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMatriculaDto } from './dto/create-matricula.dto';
import { UpdateMatriculaDto } from './dto/update-matricula.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoMatricula, Matricula, OrigenMatricula } from './entities/matricula.entity';
import { EstudiantesService } from '../estudiantes/estudiantes.service';
import { CursosService } from '../cursos/cursos.service';
import { PeriodosLectivosService } from '../periodos-lectivos/periodos-lectivos.service';
import { CreateEstudianteDto } from '../estudiantes/dto/create-estudiante.dto';
import * as XLSX from 'xlsx';
import { ParserCursoHelper } from './helpers/parse-curso.helper';
import { RegistroImportacionDto, ResultadoImportacionDto, ResumenImportacionDto } from './dto/importacion-matricula.dto';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { EstadoCurso } from '../cursos/entities/curso.entity';
import { EstadoPeriodo } from '../periodos-lectivos/entities/periodos-lectivo.entity';
import { EstadoEstudiante, Estudiante } from '../estudiantes/entities/estudiante.entity';

@Injectable()
export class MatriculasService {
  constructor(
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
    private readonly estudiantesService: EstudiantesService,
    private readonly cursosService: CursosService,
    private readonly periodosLectivosService: PeriodosLectivosService,
    private dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  // ✅ matriculas.service.ts - create() MEJORADO

  async create(createMatriculaDto: CreateMatriculaDto) {
    // 1️⃣ VALIDAR QUE EL CURSO EXISTA
    const curso = await this.cursosService.findOne(createMatriculaDto.curso_id);

    if (!curso) {
      throw new BadRequestException(
        `El curso ${createMatriculaDto.curso_id} no existe`
      );
    }

    // 2️⃣ VALIDAR QUE EL PERÍODO LECTIVO EXISTA Y ESTÉ ACTIVO
    const periodo = await this.periodosLectivosService.findOne(
      createMatriculaDto.periodo_lectivo_id
    );

    if (periodo.estado !== EstadoPeriodo.ACTIVO) {
      throw new BadRequestException(
        `El período lectivo ${periodo.nombre} no está activo. Estado actual: ${periodo.estado}`
      );
    }

    // 3️⃣ BUSCAR O CREAR ESTUDIANTE (ahora actualiza email y nombre si cambiaron)
    const createEstudianteDto: CreateEstudianteDto = {
      estudiante_cedula: createMatriculaDto.estudiante_cedula,
      nombres_completos: createMatriculaDto.nombres_completos,
      estudiante_email: createMatriculaDto.estudiante_email || undefined, // ✅ Permitir vacío
    };

    const estudiante = await this.estudiantesService.findOrCreate(
      createMatriculaDto.estudiante_cedula,
      createEstudianteDto
    );

    // 4️⃣ VALIDAR QUE NO EXISTA MATRÍCULA ACTIVA PARA ESTE ESTUDIANTE EN ESTE PERÍODO
    const matriculaExistente = await this.matriculaRepository.findOne({
      where: {
        estudiante_id: estudiante.id,
        periodo_lectivo_id: periodo.id,
        estado: EstadoMatricula.ACTIVO
      }
    });

    if (matriculaExistente) {
      throw new BadRequestException(
        `El estudiante ${estudiante.nombres_completos} ya tiene una matrícula activa en el período ${periodo.nombre}`
      );
    }

    // 5️⃣ GENERAR NÚMERO DE MATRÍCULA
    const numeroMatricula = await this.generarNumeroMatricula(periodo.id);

    // 6️⃣ CREAR LA MATRÍCULA
    const matricula = this.matriculaRepository.create({
      numero_de_matricula: numeroMatricula,
      estudiante_id: estudiante.id,
      curso_id: curso.id,
      periodo_lectivo_id: periodo.id,
      origen: createMatriculaDto.origen || OrigenMatricula.MANUAL,
      observaciones: createMatriculaDto.observaciones,
      estado: EstadoMatricula.ACTIVO
    });

    const matriculaGuardada = await this.matriculaRepository.save(matricula);

    // 7️⃣ ACTUALIZAR ESTADO DEL ESTUDIANTE SI ESTABA SIN MATRÍCULA O RETIRADO
    if (estudiante.estado === EstadoEstudiante.SIN_MATRICULA ||
      estudiante.estado === EstadoEstudiante.RETIRADO) {
      await this.estudiantesService.update(estudiante.id, {
        estado: EstadoEstudiante.ACTIVO
      });
    }

    // 8️⃣ ACTUALIZAR CONTADOR DE ESTUDIANTES EN EL CURSO
    await this.actualizarContadorCurso(curso.id);

    // 9️⃣ RETORNAR CON RELACIONES COMPLETAS
    return await this.findOne(matriculaGuardada.id);
  }

  // Procesar Excel
  async procesarArchivoImportacion(
    file: Express.Multer.File,
    periodoId: string
  ): Promise<ResumenImportacionDto> {
    // 1️⃣ Leer archivo Excel
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });

    // 2️⃣ Obtener todos los cursos disponibles
    const cursosDisponibles = await this.cursosService.findAll();

    const estudiantesMatriculados = await this.matriculaRepository.find({
      where: {
        periodo_lectivo_id: periodoId,
        estado: EstadoMatricula.ACTIVO
      },
      relations: ['estudiante', 'curso']
    });

    // Crear mapa de cédulas ya matriculadas
    const matriculasMap = new Map(
      estudiantesMatriculados.map(m => [
        m.estudiante.estudiante_cedula,
        m
      ])
    );

    const registros: RegistroImportacionDto[] = [];
    let filaGlobal = 0;

    // 3️⃣ ITERAR SOBRE CADA SHEET
    for (const nombreSheet of workbook.SheetNames) {
      const sheet = workbook.Sheets[nombreSheet];
      const data = XLSX.utils.sheet_to_json(sheet, {
        header: 'A',
        defval: '',
        raw: false
      });

      // 4️⃣ PROCESAR FILAS (empezar desde fila 2, después del encabezado)
      for (let i = 1; i < data.length; i++) {
        const row = data[i] as any;
        filaGlobal++;

        // ⏭️ IGNORAR FILAS VACÍAS
        if (ParserCursoHelper.esFilaVacia(row)) {
          continue;
        }

        // Leer datos de las columnas
        const numero = row['A']?.toString().trim();
        const año = ParserCursoHelper.limpiarTexto(row['B']);
        const paralelo = ParserCursoHelper.limpiarTexto(row['C']);
        const especialidad = ParserCursoHelper.limpiarTexto(row['D']);
        const cedula = ParserCursoHelper.limpiarCedula(row['E']);
        const nombres = ParserCursoHelper.limpiarTexto(row['F']);
        const correo = ParserCursoHelper.limpiarCorreo(row['G']);

        // 5️⃣ VALIDAR REGISTRO
        const errores: string[] = [];
        let ya_matriculado = false;

        if (!cedula) errores.push('Cédula faltante');
        if (!nombres || nombres.length < 3) errores.push('Nombres completos inválidos');
        if (correo && !correo.includes('@')) errores.push('Correo electrónico inválido');
        if (!año || !paralelo || !especialidad) {
          errores.push('Datos del curso incompletos');
        }

        if (cedula && matriculasMap.has(cedula)) {
          const matriculaExistente = matriculasMap.get(cedula);
          if (matriculaExistente) {
            ya_matriculado = true;
            errores.push(
              `Ya tiene matrícula activa en ${matriculaExistente.curso.nivel} ${matriculaExistente.curso.paralelo}`
            );
          }
        }

        // 6️⃣ PARSEAR CURSO
        const cursoParsed = año && paralelo && especialidad
          ? ParserCursoHelper.parsearCurso(año, paralelo, especialidad)
          : null;

        if (!cursoParsed) {
          errores.push('No se pudo interpretar el curso');
        }


        // 7️⃣ BUSCAR CURSO EN BD
        let cursoId: string | undefined = undefined;
        if (cursoParsed) {
          const resultado = ParserCursoHelper.buscarCursoEnBD(
            cursoParsed.nivel,
            cursoParsed.paralelo,
            cursoParsed.especialidad,
            cursosDisponibles
          );

          if (resultado.error) {
            errores.push(resultado.error);
          } else {
            cursoId = resultado.cursoId;
          }
        }

        // 8️⃣ AGREGAR REGISTRO
        registros.push({
          fila: filaGlobal,
          sheet: nombreSheet,
          año,
          paralelo,
          especialidad,
          cedula,
          nombres_completos: nombres,
          correo,
          curso_parseado: cursoParsed
            ? `${cursoParsed.nivel} ${cursoParsed.paralelo} - ${cursoParsed.especialidad}`
            : undefined,
          curso_id: cursoId,
          valido: errores.length === 0 && !ya_matriculado,
          errores,
          ya_matriculado: ya_matriculado
        });
      }
    }

    const previewId = `preview_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await this.cacheManager.set(previewId, registros, 600000);

    const existentes = registros.filter(r => r.ya_matriculado).length;

    return {
      preview_id: previewId,
      total_registros: registros.length,
      validos: registros.filter(r => r.valido).length,
      invalidos: registros.filter(r => !r.valido).length,
      existentes,
      registros
    };
  }

  async confirmarImportacion(
    previewId: string,
    periodoId: string
  ): Promise<ResultadoImportacionDto> {

    const registros = await this.cacheManager.get<RegistroImportacionDto[]>(previewId);

    if (!registros) {
      throw new BadRequestException('No se encontraron datos de previsualización. El preview_id puede haber expirado.');
    }

    const registrosValidos = registros.filter(r => r.valido && r.curso_id);
    const registrosInvalidos = registros.filter(r => !r.valido || !r.curso_id);

    if (registrosValidos.length === 0) {
      throw new BadRequestException('No hay registros válidos para importar');
    }

    const resultado: ResultadoImportacionDto = {
      exitosas: 0,
      fallidas: 0,
      detalles: [],
      resumen: {
        registros_recibidos: registros.length,
        registros_validos: registrosValidos.length,
        registros_invalidos: registrosInvalidos.length,
        registros_importados: 0,
        registros_fallidos: 0
      }
    };

    // 🔥 OPTIMIZACIÓN: Usar transacción + batch processing
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1️⃣ BATCH: Validar período una sola vez
      const periodo = await this.periodosLectivosService.findOne(periodoId);
      if (periodo.estado !== EstadoPeriodo.ACTIVO) {
        throw new BadRequestException(`El período lectivo ${periodo.nombre} no está activo`);
      }

      // 2️⃣ BATCH: Obtener todos los cursos necesarios de una vez
      const cursosIdsUnicos = [...new Set(registrosValidos.map(r => r.curso_id!))];
      const cursosMap = new Map<string, any>();
      for (const cursoId of cursosIdsUnicos) {
        const curso = await this.cursosService.findOne(cursoId);
        cursosMap.set(cursoId, curso);
      }

      // 3️⃣ BATCH: Obtener todas las cédulas para buscar estudiantes existentes
      const cedulasUnicas = [...new Set(registrosValidos.map(r => r.cedula))];
      const estudiantesExistentes = await this.dataSource
        .getRepository(Estudiante)
        .createQueryBuilder('e')
        .where('e.estudiante_cedula IN (:...cedulas)', { cedulas: cedulasUnicas })
        .getMany();

      const estudiantesPorCedula = new Map(
        estudiantesExistentes.map(e => [e.estudiante_cedula, e])
      );

      // 4️⃣ BATCH: Obtener matrículas activas existentes en este período
      const matriculasExistentes = await this.matriculaRepository
        .createQueryBuilder('m')
        .where('m.periodo_lectivo_id = :periodoId', { periodoId })
        .andWhere('m.estado = :estado', { estado: EstadoMatricula.ACTIVO })
        .getMany();

      const matriculasExistentesSet = new Set(
        matriculasExistentes.map(m => `${m.estudiante_id}:${m.periodo_lectivo_id}`)
      );

      // 5️⃣ BATCH: Generar números de matrícula secuenciales
      const anio = new Date(periodo.fechaInicio).getFullYear();
      const countExistentes = await this.matriculaRepository.count({
        where: { periodo_lectivo_id: periodoId }
      });
      let secuencial = countExistentes + 1;

      // 6️⃣ PROCESAR: Crear estudiantes nuevos en batch
      const estudiantesACrear: Estudiante[] = [];
      for (const registro of registrosValidos) {
        if (!estudiantesPorCedula.has(registro.cedula)) {
          const nuevoEstudiante = this.dataSource.getRepository(Estudiante).create({
            estudiante_cedula: registro.cedula,
            nombres_completos: registro.nombres_completos,
            estudiante_email: registro.correo || undefined,
            datos_completos: false,
            estado: EstadoEstudiante.SIN_MATRICULA
          });
          estudiantesACrear.push(nuevoEstudiante);
        }
      }

      // INSERT batch de estudiantes (lotes de 100)
      if (estudiantesACrear.length > 0) {
        const lotesEstudiantes = this.dividirEnLotes(estudiantesACrear, 100);
        for (const lote of lotesEstudiantes) {
          const saved = await queryRunner.manager.save(Estudiante, lote);
          saved.forEach(e => estudiantesPorCedula.set(e.estudiante_cedula, e));
        }
      }

      // 7️⃣ PROCESAR: Crear matrículas en batch
      const matriculasACrear: Matricula[] = [];
      const contadoresPorCurso = new Map<string, number>();

      for (const registro of registrosValidos) {
        try {
          const estudiante = estudiantesPorCedula.get(registro.cedula);
          if (!estudiante) {
            throw new Error('Estudiante no encontrado después de creación batch');
          }

          // Verificar duplicado
          const claveUnica = `${estudiante.id}:${periodoId}`;
          if (matriculasExistentesSet.has(claveUnica)) {
            throw new Error('Ya tiene matrícula activa en este período');
          }

          const numeroMatricula = `${anio}-${secuencial.toString().padStart(4, '0')}`;
          secuencial++;

          const matricula = this.matriculaRepository.create({
            numero_de_matricula: numeroMatricula,
            estudiante_id: estudiante.id,
            curso_id: registro.curso_id!,
            periodo_lectivo_id: periodoId,
            origen: OrigenMatricula.DISTRITO,
            estado: EstadoMatricula.ACTIVO
          });

          matriculasACrear.push(matricula);
          matriculasExistentesSet.add(claveUnica);

          // Contar para actualizar contadores después
          contadoresPorCurso.set(
            registro.curso_id!,
            (contadoresPorCurso.get(registro.curso_id!) || 0) + 1
          );

          resultado.exitosas++;
          resultado.detalles.push({
            cedula: registro.cedula,
            nombre: registro.nombres_completos,
            curso: registro.curso_parseado || 'Desconocido',
            estado: 'EXITOSO'
          });
        } catch (error) {
          resultado.fallidas++;
          resultado.detalles.push({
            cedula: registro.cedula,
            nombre: registro.nombres_completos,
            curso: registro.curso_parseado || 'Desconocido',
            estado: 'FALLIDO',
            error: error.message
          });
        }
      }

      // INSERT batch de matrículas (lotes de 100)
      if (matriculasACrear.length > 0) {
        const lotesMatriculas = this.dividirEnLotes(matriculasACrear, 100);
        for (const lote of lotesMatriculas) {
          await queryRunner.manager.save(Matricula, lote);
        }
      }

      // 8️⃣ BATCH: Actualizar estado de estudiantes nuevos a ACTIVO
      const idsEstudiantesNuevos = estudiantesACrear
        .map(e => estudiantesPorCedula.get(e.estudiante_cedula)?.id)
        .filter(Boolean);

      if (idsEstudiantesNuevos.length > 0) {
        const lotesIds = this.dividirEnLotes(idsEstudiantesNuevos as string[], 500);
        for (const lote of lotesIds) {
          await queryRunner.manager
            .createQueryBuilder()
            .update('estudiantes')
            .set({ estado: EstadoEstudiante.ACTIVO })
            .whereInIds(lote)
            .execute();
        }
      }

      await queryRunner.commitTransaction();

      // 9️⃣ FUERA DE TRANSACCIÓN: Actualizar contadores de cursos
      for (const [cursoId] of contadoresPorCurso) {
        await this.actualizarContadorCurso(cursoId);
      }

      resultado.resumen.registros_importados = resultado.exitosas;
      resultado.resumen.registros_fallidos = resultado.fallidas;

      await this.cacheManager.del(previewId);

      return resultado;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async findAll() {
    const matriculas = await this.matriculaRepository.find({
      relations: ['estudiante', 'curso', 'periodo_lectivo'],
      order: { estudiante: { nombres_completos: 'ASC' } }
    });

    return matriculas.map(m => ({
      id: m.id,
      numero_de_matricula: m.numero_de_matricula,
      estudiante_cedula: m.estudiante.estudiante_cedula,
      nombres_completos: m.estudiante.nombres_completos,
      estudiante_email: m.estudiante.estudiante_email,
      curso_id: m.curso_id,
      curso: {
        id: m.curso.id,
        nivel: m.curso.nivel,
        paralelo: m.curso.paralelo,
        especialidad: m.curso.especialidad
      },
      periodo_lectivo_id: m.periodo_lectivo_id,
      periodo_lectivo: {
        id: m.periodo_lectivo.id,
        nombre: m.periodo_lectivo.nombre
      },
      estado: m.estado,
      origen: m.origen,
      fecha_retiro: m.fecha_retiro,
      observaciones: m.observaciones,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));
  }

  async findOne(id: string, useCache = true) {
    const matricula = await this.matriculaRepository.findOne({
      where: { id },
      relations: ['estudiante', 'curso', 'periodo_lectivo'],
      cache: useCache // ✅ Control de caché
    });

    if (!matricula) {
      throw new NotFoundException(`Matrícula con ID ${id} no encontrada`);
    }

    return {
      id: matricula.id,
      numero_de_matricula: matricula.numero_de_matricula,
      estudiante_cedula: matricula.estudiante.estudiante_cedula,
      nombres_completos: matricula.estudiante.nombres_completos,
      estudiante_email: matricula.estudiante.estudiante_email,
      curso_id: matricula.curso_id,
      curso: {
        id: matricula.curso.id,
        nivel: matricula.curso.nivel,
        paralelo: matricula.curso.paralelo,
        especialidad: matricula.curso.especialidad
      },
      periodo_lectivo_id: matricula.periodo_lectivo_id,
      periodo_lectivo: {
        id: matricula.periodo_lectivo.id,
        nombre: matricula.periodo_lectivo.nombre
      },
      estado: matricula.estado,
      origen: matricula.origen,
      fecha_retiro: matricula.fecha_retiro,
      observaciones: matricula.observaciones,
      createdAt: matricula.createdAt,
      updatedAt: matricula.updatedAt
    };
  }

  async findByCurso(cursoId: string): Promise<Matricula[]> {
    const matriculas = await this.matriculaRepository.find({
      where: { curso_id: cursoId },
      relations: ['estudiante', 'curso', 'periodo_lectivo'],
      order: { estudiante: { nombres_completos: 'ASC' } }
    });

    return matriculas;
  }

  async update(id: string, updateMatriculaDto: UpdateMatriculaDto) {
    // ✅ USAR TRANSACCIÓN PARA GARANTIZAR CONSISTENCIA
    return await this.dataSource.transaction(async (manager) => {
      // 1️⃣ Buscar la matrícula SIN relaciones (solo IDs)
      const matricula = await manager.findOne(Matricula, {
        where: { id },
        relations: ['estudiante'] // Solo necesitamos estudiante para validaciones
      });

      if (!matricula) {
        throw new NotFoundException(`Matrícula con ID ${id} no encontrada`);
      }

      let debeActualizarContadores = false;
      const cursoAnteriorId = matricula.curso_id;

      // 2️⃣ CAMBIO DE CURSO
      if (updateMatriculaDto.curso_id && updateMatriculaDto.curso_id !== matricula.curso_id) {

        // Validar que el nuevo curso existe y está activo
        const nuevoCurso = await this.cursosService.findOne(updateMatriculaDto.curso_id);

        if (!nuevoCurso) {
          throw new BadRequestException(`El curso ${updateMatriculaDto.curso_id} no existe`);
        }

        if (nuevoCurso.estado !== EstadoCurso.ACTIVO) {
          throw new BadRequestException('El curso seleccionado no está activo');
        }

        // ✅ Actualizar directamente en la BD
        await manager.update(Matricula, { id }, { curso_id: updateMatriculaDto.curso_id });

        debeActualizarContadores = true;
      }

      // 3️⃣ ACTUALIZAR DATOS DEL ESTUDIANTE
      if (
        updateMatriculaDto.estudiante_cedula ||
        updateMatriculaDto.nombres_completos ||
        updateMatriculaDto.estudiante_email
      ) {
        const updateEstudianteData: any = {};

        if (updateMatriculaDto.estudiante_cedula) {
          if (updateMatriculaDto.estudiante_cedula !== matricula.estudiante.estudiante_cedula) {
            const estudianteExistente = await this.estudiantesService.findByCedula(
              updateMatriculaDto.estudiante_cedula
            );

            if (estudianteExistente && estudianteExistente.id !== matricula.estudiante_id) {
              throw new BadRequestException(
                `Ya existe un estudiante con la cédula ${updateMatriculaDto.estudiante_cedula}`
              );
            }
          }
          updateEstudianteData.estudiante_cedula = updateMatriculaDto.estudiante_cedula;
        }

        if (updateMatriculaDto.nombres_completos) {
          updateEstudianteData.nombres_completos = updateMatriculaDto.nombres_completos;
        }

        if (updateMatriculaDto.estudiante_email) {
          updateEstudianteData.estudiante_email = updateMatriculaDto.estudiante_email;
        }

        if (Object.keys(updateEstudianteData).length > 0) {
          await this.estudiantesService.update(matricula.estudiante_id, updateEstudianteData);
        }
      }

      // 4️⃣ ACTUALIZAR ESTADO Y OBSERVACIONES
      const updateData: any = {};

      if (updateMatriculaDto.estado === EstadoMatricula.RETIRADO) {
        if (!updateMatriculaDto.fecha_retiro) {
          throw new BadRequestException('La fecha de retiro es obligatoria');
        }
        updateData.estado = EstadoMatricula.RETIRADO;
        updateData.fecha_retiro = new Date(updateMatriculaDto.fecha_retiro);
      }

      if (updateMatriculaDto.observaciones) {
        updateData.observaciones = updateMatriculaDto.observaciones;
      }

      // ✅ Actualizar en una sola query si hay cambios
      if (Object.keys(updateData).length > 0) {
        await manager.update(Matricula, { id }, updateData);
      }

      // 5️⃣ ACTUALIZAR CONTADORES FUERA DE LA TRANSACCIÓN
      if (debeActualizarContadores) {
        // Ejecutar después de la transacción
        await this.actualizarContadorCurso(cursoAnteriorId);
        await this.actualizarContadorCurso(updateMatriculaDto.curso_id!);
      }

      // 6️⃣ RETORNAR DATOS ACTUALIZADOS
      return await this.findOne(id, false);
    });
  }

  async reactivar(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      // 1️⃣ Buscar la matrícula
      const matricula = await manager.findOne(Matricula, {
        where: { id },
        relations: ['estudiante', 'curso', 'periodo_lectivo']
      });

      if (!matricula) {
        throw new NotFoundException(`Matrícula con ID ${id} no encontrada`);
      }

      // 2️⃣ Validar que la matricula este retirada
      if (matricula.estado !== EstadoMatricula.RETIRADO) {
        throw new BadRequestException('La matrícula no está retirada');
      }

      if (matricula.estudiante.estado === EstadoEstudiante.GRADUADO) {
        throw new BadRequestException(
          'No se puede reactivar la matrícula: el estudiante ya se graduó.'
        );
      }

      if (matricula.estudiante.estado === EstadoEstudiante.RETIRADO) {
        throw new BadRequestException(
          'No se puede reactivar la matrícula: el estudiante está retirado. Reactive primero al estudiante desde el módulo de Estudiantes.'
        );
      }

      // 3️⃣ Validar que el período lectivo siga activo
      const periodo = await this.periodosLectivosService.findOne(matricula.periodo_lectivo_id);
      if (periodo.estado !== EstadoPeriodo.ACTIVO) {
        throw new BadRequestException(
          `No se puede reactivar: el período lectivo ${periodo.nombre} ya no está activo`
        );
      }

      // 4️⃣ Validar que el curso siga activo
      const curso = await this.cursosService.findOne(matricula.curso_id);
      if (curso.estado !== EstadoCurso.ACTIVO) {
        throw new BadRequestException(
          `No se puede reactivar: el curso ya no está activo`
        );
      }

      // 5️⃣ Reactivar matrícula
      await manager.update(Matricula, { id }, {
        estado: EstadoMatricula.ACTIVO,
        fecha_retiro: undefined,
        observaciones: matricula.observaciones
          ? `${matricula.observaciones}\n[${new Date().toLocaleString('es-EC')}] Estudiante reactivado`
          : `[${new Date().toLocaleString('es-EC')}] Estudiante reactivado`
      });

      // 6️⃣ Reactivar estudiante en la tabla de estudiantes
      if (matricula.estudiante.estado === EstadoEstudiante.SIN_MATRICULA) {
        await manager.update('estudiantes', matricula.estudiante_id, {
          estado: EstadoEstudiante.ACTIVO
        });
      }

      // 7️⃣ Actualizar contador del curso
      await this.actualizarContadorCurso(matricula.curso_id);

      // 8️⃣ Retornar matrícula actualizada
      return await this.findOne(id, false);
    });
  }

  async remove(id: string, observaciones?: string) {
    const matricula = await this.matriculaRepository.findOne({
      where: { id },
      relations: ['estudiante']
    });

    if (!matricula) {
      throw new NotFoundException(`Matrícula no encontrada`);
    }

    if (matricula.estado === EstadoMatricula.RETIRADO) {
      throw new BadRequestException('La matrícula ya está retirada');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      matricula.estado = EstadoMatricula.RETIRADO;
      matricula.fecha_retiro = new Date();
      matricula.observaciones = observaciones || 'Matrícula retirada';

      await queryRunner.manager.save(matricula);

      const matriculasActivas = await queryRunner.manager.count(Matricula, {
        where: {
          estudiante_id: matricula.estudiante_id,
          estado: EstadoMatricula.ACTIVO
        }
      });

      if (matriculasActivas === 0) {
        await queryRunner.manager.update('estudiantes', matricula.estudiante_id, {
          estado: EstadoEstudiante.SIN_MATRICULA
        });
      }

      await this.actualizarContadorCurso(matricula.curso_id);
      await queryRunner.commitTransaction();

      return await this.findOne(id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async actualizarContadorCurso(cursoId: string): Promise<void> {
    const count = await this.matriculaRepository.count({
      where: {
        curso_id: cursoId,
        estado: EstadoMatricula.ACTIVO
      }
    });

    await this.cursosService.actualizarContadorEstudiantes(cursoId, count);
  }

  private async generarNumeroMatricula(periodoLectivoId: string): Promise<string> {
    const periodo = await this.periodosLectivosService.findOne(periodoLectivoId);
    const anio = new Date(periodo.fechaInicio).getFullYear();

    // 🔥 Usar query atómica con lock
    const result = await this.matriculaRepository
      .createQueryBuilder('m')
      .select('COUNT(*)', 'count')
      .where('m.periodo_lectivo_id = :periodoLectivoId', { periodoLectivoId })
      .setLock('pessimistic_write')
      .getRawOne();

    const numeroSecuencial = (parseInt(result.count) + 1).toString().padStart(4, '0');
    return `${anio}-${numeroSecuencial}`;
  }

  private dividirEnLotes<T>(array: T[], tamanioLote: number): T[][] {
    const lotes: T[][] = [];
    for (let i = 0; i < array.length; i += tamanioLote) {
      lotes.push(array.slice(i, i + tamanioLote));
    }
    return lotes;
  }
}