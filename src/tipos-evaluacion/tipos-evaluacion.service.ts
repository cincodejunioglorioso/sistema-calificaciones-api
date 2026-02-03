import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTipoEvaluacionDto } from './dto/create-tipos-evaluacion.dto';
import { UpdateTipoEvaluacionDto } from './dto/update-tipos-evaluacion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NombreTipoEvaluacion, TipoEvaluacion } from './entities/tipos-evaluacion.entity';
import { Repository } from 'typeorm';
import { EstadoPeriodo } from '../periodos-lectivos/entities/periodos-lectivo.entity';

@Injectable()
export class TiposEvaluacionService {

  constructor(
    @InjectRepository(TipoEvaluacion)
    private readonly tipoEvaluacionRepository: Repository<TipoEvaluacion>
  ) { }

  async create(createTipoEvaluacionDto: CreateTipoEvaluacionDto) {

    const tipoExistente = await this.tipoEvaluacionRepository.findOne({
      where: {
        periodo_lectivo_id: createTipoEvaluacionDto.periodo_lectivo_id,
        nombre: createTipoEvaluacionDto.nombre
      }
    });

    if (tipoExistente) {
      throw new ConflictException('El tipo de evaluación ya existe para este periodo lectivo');
    }

    await this.validarSumaPorcentajes(
      createTipoEvaluacionDto.periodo_lectivo_id,
      createTipoEvaluacionDto.porcentaje
    );

    const tipoEvaluacion = this.tipoEvaluacionRepository.create(createTipoEvaluacionDto)
    return await this.tipoEvaluacionRepository.save(tipoEvaluacion);
  }

  async createBatch(periodo_lectivo_id: string, porcentajes: {
    insumos: number;
    proyecto: number;
    examen: number;
  }) {
    // Validar que sumen 100%
    const suma = porcentajes.insumos + porcentajes.proyecto + porcentajes.examen;
    if (Math.abs(suma - 100) > 0.01) {
      throw new BadRequestException(
        `Los porcentajes deben sumar 100%. Suma actual: ${suma.toFixed(2)}%`
      );
    }

    // Crear los 3 tipos
    const tipos = [
      { periodo_lectivo_id, nombre: NombreTipoEvaluacion.INSUMOS, porcentaje: porcentajes.insumos },
      { periodo_lectivo_id, nombre: NombreTipoEvaluacion.PROYECTO, porcentaje: porcentajes.proyecto },
      { periodo_lectivo_id, nombre: NombreTipoEvaluacion.EXAMEN, porcentaje: porcentajes.examen }
    ];

    const tiposCreados = await Promise.all(
      tipos.map(tipo => this.create(tipo))
    );

    return { tipos: tiposCreados };
  }

  async findAll() {
    const tiposEvaluacion = await this.tipoEvaluacionRepository.find({
      order: {
        porcentaje: 'DESC'
      }
    });

    if (!tiposEvaluacion || tiposEvaluacion.length === 0) {
      throw new NotFoundException('No se encontraron tipos de evaluación');
    }

    return tiposEvaluacion;
  }

  async findOne(id: string) {
    const tipoEvaluacion = await this.tipoEvaluacionRepository.findOne({
      where: { id }
    });

    if (!tipoEvaluacion) {
      throw new NotFoundException('Tipo de evaluación no encontrado');
    }

    return tipoEvaluacion;
  }


  async findByPeriodo(periodo_lectivo_id: string) {
    const tiposEvaluacion = await this.tipoEvaluacionRepository.find({
      where: { periodo_lectivo_id },
      order: { porcentaje: 'DESC' }
    });

    if (!tiposEvaluacion || tiposEvaluacion.length === 0) {
      throw new NotFoundException(
        'No hay tipos de evaluación configurados para este período lectivo'
      );
    }

    return tiposEvaluacion;
  }

  async update(id: string, updateTipoEvaluacionDto: UpdateTipoEvaluacionDto) {
    const tipo = await this.findOne(id);

    if (tipo.periodo_lectivo_id === EstadoPeriodo.FINALIZADO) {
      throw new BadRequestException(
        'No se puede modificar el tipo de evaluación de un período finalizado'
      );
    }

    // Si se actualiza el porcentaje, validar suma
    if (updateTipoEvaluacionDto.porcentaje !== undefined) {
      await this.validarSumaPorcentajes(
        tipo.periodo_lectivo_id,
        updateTipoEvaluacionDto.porcentaje,
        id // Excluir el tipo actual de la suma
      );
    }

    Object.assign(tipo, updateTipoEvaluacionDto);
    return await this.tipoEvaluacionRepository.save(tipo);
  }

  private async validarSumaPorcentajes(
    periodo_lectivo_id: string,
    nuevoPorcentaje: number,
    excluirId?: string
  ) {
    const queryBuilder = this.tipoEvaluacionRepository
      .createQueryBuilder('tipo')
      .select('SUM(tipo.porcentaje)', 'suma')
      .where('tipo.periodo_lectivo_id = :periodo_lectivo_id', { periodo_lectivo_id });

    // Si estamos actualizando, excluir el tipo actual
    if (excluirId) {
      queryBuilder.andWhere('tipo.id != :excluirId', { excluirId });
    }

    const result = await queryBuilder.getRawOne();
    const sumaActual = parseFloat(result.suma || '0');
    const sumaTotal = sumaActual + nuevoPorcentaje;

    if (sumaTotal > 100) {
      throw new BadRequestException(
        `La suma de porcentajes no puede exceder 100%. ` +
        `Suma actual: ${sumaActual.toFixed(2)}%, ` +
        `intentando agregar: ${nuevoPorcentaje}%, ` +
        `total: ${sumaTotal.toFixed(2)}%`
      );
    }
  }

  async validarPorcentajesCompletos(periodo_lectivo_id: string): Promise<boolean> {
    const tipos = await this.tipoEvaluacionRepository.find({
      where: { periodo_lectivo_id }
    });

    if (tipos.length !== 3) {
      return false;
    }

    const suma = tipos.reduce((acc, tipo) =>
      acc + parseFloat(tipo.porcentaje.toString()), 0
    );

    return Math.abs(suma - 100) < 0.01;
  }

  async updateBatch(periodo_id: string, porcentajes: {
    insumos: number;
    proyecto: number;
    examen: number;
  }) {
    // Validar que sumen 100%
    const suma = porcentajes.insumos + porcentajes.proyecto + porcentajes.examen;
    if (Math.abs(suma - 100) > 0.01) {
      throw new BadRequestException(
        `Los porcentajes deben sumar 100%. Suma actual: ${suma.toFixed(2)}%`
      );
    }

    // Obtener los tipos existentes
    const tipos = await this.findByPeriodo(periodo_id);

    if (tipos.length !== 3) {
      throw new BadRequestException(
        'El período debe tener exactamente 3 tipos de evaluación configurados'
      );
    }

    // Actualizar cada tipo directamente (sin validación individual de suma)
    for (const tipo of tipos) {
      if (tipo.nombre === NombreTipoEvaluacion.INSUMOS) {
        tipo.porcentaje = porcentajes.insumos;
      } else if (tipo.nombre === NombreTipoEvaluacion.PROYECTO) {
        tipo.porcentaje = porcentajes.proyecto;
      } else if (tipo.nombre === NombreTipoEvaluacion.EXAMEN) {
        tipo.porcentaje = porcentajes.examen;
      }
    }

    // Guardar todos los cambios de una vez
    const tiposActualizados = await this.tipoEvaluacionRepository.save(tipos);

    return {
      message: 'Porcentajes actualizados exitosamente',
      tipos: tiposActualizados
    };
  }

  async verificarPromediosGenerados(periodo_id: string) {
    // Verificar si existen promedios de trimestre para algún trimestre de este período
    const query = `
    SELECT COUNT(*) as count
    FROM promedio_trimestre pt
    INNER JOIN trimestres t ON pt.trimestre_id = t.id
    WHERE t.periodo_lectivo_id = $1
  `;

    const result = await this.tipoEvaluacionRepository.query(query, [periodo_id]);
    const count = parseInt(result[0].count);

    return {
      hayPromedios: count > 0,
      totalPromedios: count
    };
  }
}
