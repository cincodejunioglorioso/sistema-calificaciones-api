import { CalificacionCualitativa } from "../enums/cualitativa.enum";

export const ESCALA_CUALITATIVA = {
    DA: { min: 9.00, max: 10.0, descripcion: 'Domina los aprendizajes requeridos' },
    AA: { min: 7.00, max: 8.99, descripcion: 'Alcanza los aprendizajes requeridos' },
    PA: { min: 4.01, max: 6.99, descripcion: 'Próximo a alcanzar los aprendizajes requeridos' },
    NA: { min: 0.00, max: 4.00, descripcion: 'No alcanza los aprendizajes requeridos' }
} as const;

export function calcularCalificacionCualitativa(nota: number): CalificacionCualitativa {
    if (nota >= ESCALA_CUALITATIVA.DA.min) return CalificacionCualitativa.DA;
    if (nota >= ESCALA_CUALITATIVA.AA.min) return CalificacionCualitativa.AA;
    if (nota >= ESCALA_CUALITATIVA.PA.min) return CalificacionCualitativa.PA;
    return CalificacionCualitativa.NA;
}