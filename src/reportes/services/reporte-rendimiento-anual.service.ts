import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromedioPeriodo, EstadoPromedioAnual } from '../../promedio-periodo/entities/promedio-periodo.entity';
import { MateriaCurso } from '../../materia-curso/entities/materia-curso.entity';
import { PeriodoLectivo, EstadoSupletorio } from '../../periodos-lectivos/entities/periodos-lectivo.entity';
import { Trimestre, TrimestreEstado } from '../../trimestres/entities/trimestre.entity';
import {
    DatosRendimientoAnual,
    CalificacionEstudianteRendimiento,
    EstadisticasRendimientoAnual
} from '../interfaces/datos-rendimiento-anual.interface';
import { calcularConversionCualitativa } from '../../common/constants/escalas.constants';

@Injectable()
export class ReporteRendimientoAnualService {
    constructor(
        @InjectRepository(PromedioPeriodo)
        private readonly promedioPeriodoRepository: Repository<PromedioPeriodo>,
        @InjectRepository(MateriaCurso)
        private readonly materiaCursoRepository: Repository<MateriaCurso>,
        @InjectRepository(PeriodoLectivo)
        private readonly periodoLectivoRepository: Repository<PeriodoLectivo>,
        @InjectRepository(Trimestre)
        private readonly trimestreRepository: Repository<Trimestre>,
    ) { }

    async obtenerDatosRendimientoAnual(
        materia_curso_id: string,
        periodo_lectivo_id: string
    ): Promise<DatosRendimientoAnual> {

        // 1. Validar materia-curso
        const materiaCurso = await this.materiaCursoRepository.findOne({
            where: { id: materia_curso_id },
            relations: ['materia', 'curso', 'docente']
        });

        if (!materiaCurso) {
            throw new NotFoundException('Materia-curso no encontrada');
        }

        // 2. Validar período lectivo
        const periodoLectivo = await this.periodoLectivoRepository.findOne({
            where: { id: periodo_lectivo_id }
        });

        if (!periodoLectivo) {
            throw new NotFoundException('Período lectivo no encontrado');
        }

        // 3. VALIDAR que el estado de supletorio esté CERRADO
        if (periodoLectivo.estado_supletorio !== EstadoSupletorio.CERRADO) {
            throw new BadRequestException(
                'El reporte de rendimiento anual solo está disponible cuando el período de supletorios está CERRADO'
            );
        }

        // 4. VALIDAR que los 3 trimestres estén FINALIZADOS
        const trimestres = await this.trimestreRepository.find({
            where: { periodo_lectivo_id },
            order: { nombre: 'ASC' }
        });

        if (trimestres.length !== 3) {
            throw new BadRequestException(
                'El período lectivo debe tener exactamente 3 trimestres'
            );
        }

        const trimestresNoFinalizados = trimestres.filter(
            t => t.estado !== TrimestreEstado.FINALIZADO
        );

        if (trimestresNoFinalizados.length > 0) {
            throw new BadRequestException(
                `Los 3 trimestres deben estar FINALIZADOS para generar el reporte de rendimiento anual. Trimestres pendientes: ${trimestresNoFinalizados.map(t => t.nombre).join(', ')}`
            );
        }

        // 5. Obtener todos los promedios anuales de esta materia-curso
        const promediosPeriodo = await this.promedioPeriodoRepository.find({
            where: { materia_curso_id, periodo_lectivo_id },
            relations: ['estudiante'],
            order: { estudiante: { nombres_completos: 'ASC' } }
        });

        if (promediosPeriodo.length === 0) throw new NotFoundException('No hay calificaciones anuales');

        // 1. Procesar Estudiantes
        const estudiantesReporte: CalificacionEstudianteRendimiento[] = promediosPeriodo.map((promedio, index) => {
            let estado_antes: 'APROBADO' | 'SUPLETORIO' | 'REPROBADO';
            const pAnual = Number(promedio.promedio_anual);

            if (pAnual >= 7.0) estado_antes = 'APROBADO';
            else if (pAnual < 5.0) estado_antes = 'REPROBADO';
            else estado_antes = 'SUPLETORIO';

            return {
                numero: index + 1,
                estudiante_nombre: promedio.estudiante.nombres_completos,
                trimestre_1: Number(promedio.nota_trimestre_1),
                cualitativa_1: calcularConversionCualitativa(Number(promedio.nota_trimestre_1)),
                trimestre_2: Number(promedio.nota_trimestre_2),
                cualitativa_2: calcularConversionCualitativa(Number(promedio.nota_trimestre_2)),
                trimestre_3: Number(promedio.nota_trimestre_3),
                cualitativa_3: calcularConversionCualitativa(Number(promedio.nota_trimestre_3)),
                promedio_anual: pAnual,
                cualitativa_anual: promedio.cualitativa_anual,
                estado_antes_supletorio: estado_antes,
                promedio_final: promedio.promedio_final ? Number(promedio.promedio_final) : null,
                cualitativa_final: promedio.cualitativa_final,
                estado_final: promedio.estado // Estado final real de la BD
            };
        });

        const totalEst = estudiantesReporte.length;

        // 2. Fila de Promedios Globales
        const promedios_globales = {
            trimestre_1: Number((estudiantesReporte.reduce((acc, e) => acc + e.trimestre_1, 0) / totalEst).toFixed(2)),
            trimestre_2: Number((estudiantesReporte.reduce((acc, e) => acc + e.trimestre_2, 0) / totalEst).toFixed(2)),
            trimestre_3: Number((estudiantesReporte.reduce((acc, e) => acc + e.trimestre_3, 0) / totalEst).toFixed(2)),
            promedio_anual: Number((estudiantesReporte.reduce((acc, e) => acc + e.promedio_anual, 0) / totalEst).toFixed(2)),
        };

        // 3. Cuadro Izquierdo (Rendimiento DA, AA, PA, NA)
        const estadisticas_rendimiento = {
            da: estudiantesReporte.filter(e => e.promedio_anual >= 9).length,
            aa: estudiantesReporte.filter(e => e.promedio_anual >= 7 && e.promedio_anual < 9).length,
            pa: estudiantesReporte.filter(e => e.promedio_anual >= 4.01 && e.promedio_anual < 7).length,
            na: estudiantesReporte.filter(e => e.promedio_anual <= 4).length,
        };

        // 4. Cuadro Derecho (Resumen Anual)
        const resumen_anual = {
            trimestral_aprobados: estudiantesReporte.filter(e => e.estado_antes_supletorio === 'APROBADO').length,
            trimestral_supletorios: estudiantesReporte.filter(e => e.estado_antes_supletorio === 'SUPLETORIO').length,
            trimestral_reprobados: estudiantesReporte.filter(e => e.estado_antes_supletorio === 'REPROBADO').length,
            supletorio_aprobados: estudiantesReporte.filter(e => e.estado_antes_supletorio === 'SUPLETORIO' && e.estado_final === 'APROBADO').length,
            supletorio_reprobados: estudiantesReporte.filter(e => e.estado_antes_supletorio === 'SUPLETORIO' && e.estado_final === 'REPROBADO').length,
        };

        // 5. RESUMEN FINAL (Basado en estado_final / EQUIVALENCIA FINAL)
        const total_aprobados = estudiantesReporte.filter(e => e.estado_final === 'APROBADO').length;
        const total_reprobados = estudiantesReporte.filter(e => e.estado_final === 'REPROBADO').length;

        const resumen_final = {
            aprobados: total_aprobados,
            porcentaje_aprobados: totalEst > 0 ? Number(((total_aprobados / totalEst) * 100).toFixed(2)) : 0,
            reprobados: total_reprobados,
            porcentaje_reprobados: totalEst > 0 ? Number(((total_reprobados / totalEst) * 100).toFixed(2)) : 0,
            total_asistentes: totalEst
        };

        return {
            materia: { id: materiaCurso.materia.id, nombre: materiaCurso.materia.nombre },
            curso: { nivel: materiaCurso.curso.nivel, paralelo: materiaCurso.curso.paralelo, especialidad: materiaCurso.curso.especialidad },
            periodo: { nombre: periodoLectivo.nombre },
            docente: materiaCurso.docente ? { nombres: materiaCurso.docente.nombres, apellidos: materiaCurso.docente.apellidos } : null,
            estudiantes: estudiantesReporte,
            promedios_globales,
            estadisticas_rendimiento,
            resumen_anual,
            resumen_final
        };

    }
}