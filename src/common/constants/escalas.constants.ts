import { ConversionCualitativa } from "../enums/cualitativa.enum";

export const ESCALA_CUALITATIVA = {
    DA: { min: 9.00, max: 10.0, descripcion: 'Domina los aprendizajes requeridos' },
    AA: { min: 7.00, max: 8.99, descripcion: 'Alcanza los aprendizajes requeridos' },
    PA: { min: 4.01, max: 6.99, descripcion: 'Próximo a alcanzar los aprendizajes requeridos' },
    NA: { min: 0.00, max: 4.00, descripcion: 'No alcanza los aprendizajes requeridos' }
} as const;

export function calcularConversionCualitativa(nota: number): ConversionCualitativa {
    if (nota >= ESCALA_CUALITATIVA.DA.min) return ConversionCualitativa.DA;
    if (nota >= ESCALA_CUALITATIVA.AA.min) return ConversionCualitativa.AA;
    if (nota >= ESCALA_CUALITATIVA.PA.min) return ConversionCualitativa.PA;
    return ConversionCualitativa.NA;
}