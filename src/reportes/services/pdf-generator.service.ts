// nest-backend/src/reportes/services/pdf-generator.service.ts
import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { DatosLibretaEstudiante } from '../interfaces/datos-libreta.interface';
import { DatosReporteMateria } from '../interfaces/datos-reporte-materia.interface';
import { ConversionCualitativa } from '../../common/enums/cualitativa.enum';
import { DatosConcentradoCalificaciones } from '../interfaces/datos-concentrado.interface';
import { DatosReporteInsumos } from '../interfaces/datos-reporte-insumos.interface';
import { DatosRendimientoAnual } from '../interfaces/datos-rendimiento-anual.interface';

@Injectable()
export class PdfGeneratorService {

    /**
     * Genera PDF de libreta de estudiante (ORIENTACIÓN HORIZONTAL - 1 PÁGINA)
     */
    async generarLibretaPDF(datos: DatosLibretaEstudiante): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    layout: 'landscape', // HORIZONTAL
                    margins: { top: 30, bottom: 30, left: 30, right: 30 }
                });

                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // ENCABEZADO INSTITUCIONAL
                this.dibujarEncabezadoLibreta(doc, datos);


                // TABLA DE CALIFICACIONES POR TRIMESTRE (COMPACTA)
                this.dibujarTablaTrimestreCompacta(doc, datos);

                // ESCALAS Y OBSERVACIONES
                this.dibujarEscalas(doc, datos);

                // PIE DE PÁGINA
                this.dibujarObservacionesYFirmas(doc, datos);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    async generarLibretasConsolidadas(
        datosLibretas: DatosLibretaEstudiante[]
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    layout: 'landscape', // ✅ HORIZONTAL
                    margins: { top: 30, bottom: 30, left: 30, right: 30 },
                    bufferPages: false,
                });

                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const totalEstudiantes = datosLibretas.length;

                datosLibretas.forEach((datos, index) => {
                    if (index > 0) {
                        doc.addPage();
                    }

                    // Generar libreta para este estudiante
                    this.dibujarEncabezadoLibreta(doc, datos);
                    this.dibujarTablaTrimestreCompacta(doc, datos);
                    this.dibujarEscalas(doc, datos);
                    this.dibujarObservacionesYFirmas(doc, datos);
                });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Genera PDF de reporte de materia por trimestre (ORIENTACIÓN HORIZONTAL)
     */
    async generarReporteMateriaPDF(datos: DatosReporteMateria): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    layout: 'portrait',
                    margins: { top: 30, bottom: 30, left: 30, right: 30 }
                });

                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.dibujarEncabezadoReporteMateria(doc, datos);

                this.dibujarTablaCalificacionesMateria(doc, datos);

                this.dibujarRendimientoYEscala(doc, datos);

                this.dibujarFirmaDocente(doc, datos);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
 * Genera PDF de concentrado de calificaciones (LEGAL LANDSCAPE)
 */
    async generarConcentradoPDF(datos: DatosConcentradoCalificaciones): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'LEGAL',
                    layout: 'landscape',
                    margins: { top: 20, bottom: 20, left: 20, right: 20 }
                });

                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.dibujarEncabezadoConcentrado(doc, datos);
                this.dibujarTablaConcentrado(doc, datos);
                this.dibujarFirmaConcentrado(doc, datos);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Genera PDF de reporte de insumos
     */
    async generarReporteInsumosPDF(datos: DatosReporteInsumos): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'LEGAL',
                    layout: 'portrait',
                    margins: { top: 30, bottom: 30, left: 30, right: 30 }
                });

                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.dibujarEncabezadoReporteInsumos(doc, datos);
                this.dibujarTablaInsumos(doc, datos);
                this.dibujarRendimientoYEscalaInsumos(doc, datos);
                this.dibujarFirmaDocenteInsumos(doc, datos);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    async generarRendimientoAnualPDF(datos: DatosRendimientoAnual): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    layout: 'portrait',
                    margins: { top: 30, bottom: 30, left: 30, right: 30 }
                });

                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                this.dibujarEncabezadoRendimientoAnual(doc, datos);
                this.dibujarTablaRendimientoAnual(doc, datos);
                this.dibujarCuadrosEstadisticosAnuales(doc, datos);
                this.dibujarResumenFinal(doc, datos);
                this.dibujarFirmaDocenteAnual(doc, datos);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }


    // ==================== MÉTODOS DE DIBUJO PARA LIBRETA INDIVIDUAL ====================
    private dibujarEncabezadoLibreta(doc: PDFKit.PDFDocument, datos: DatosLibretaEstudiante) {
        const pageWidth = doc.page.width;
        const marginLeft = 30;
        const marginRight = 30;
        const encabezadoWidth = pageWidth - marginLeft - marginRight;
        let currentY = 30;

        const logoPath = 'public/assets/logo.jpg'; // Ajusta la ruta según tu estructura

        try {
            // Marca de agua centrada con opacidad
            const marcaAguaSize = 250;
            const marcaAguaX = (pageWidth - marcaAguaSize) / 2;
            const marcaAguaY = 200;

            doc.save();
            doc.opacity(0.08); // 8% de opacidad para marca de agua
            doc.image(logoPath, marcaAguaX, marcaAguaY, {
                width: marcaAguaSize,
                height: marcaAguaSize,
                align: 'center',
                valign: 'center'
            });
            doc.restore();
        } catch (error) {
            console.warn('No se pudo cargar el logo para marca de agua:', error);
        }


        // ============ PRIMERA SECCIÓN: TÍTULO INSTITUCIONAL + RÉGIMEN ============
        const tituloHeight = 55; // ✅ Aumentado para incluir régimen

        doc
            .rect(marginLeft, currentY, encabezadoWidth, tituloHeight)
            .lineWidth(1)
            .stroke('#000');

        // ✅ LOGO INSTITUCIONAL (esquina izquierda superior)
        try {
            const logoSize = 35;
            const logoX = marginLeft + 5;
            const logoY = currentY + 7;

            doc.image(logoPath, logoX, logoY, {
                width: logoSize,
                height: logoSize
            });
        } catch (error) {
            console.warn('No se pudo cargar el logo institucional:', error);
        }

        // Título principal
        doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text(
                'UNIDAD EDUCATIVA FISCAL CINCO DE JUNIO',
                marginLeft,
                currentY + 8,
                {
                    width: encabezadoWidth,
                    align: 'center'
                }
            );

        // Subtítulo
        doc
            .fontSize(9)
            .font('Helvetica')
            .text(
                'REPORTE DE EVALUACIÓN',
                marginLeft,
                currentY + 23,
                {
                    width: encabezadoWidth,
                    align: 'center'
                }
            );

        // ✅ RÉGIMEN: COSTA (abajo del subtítulo, alineado a la izquierda)
        doc
            .fontSize(8)
            .font('Helvetica')
            .text('Régimen:', marginLeft + 5, currentY + 40)
            .font('Helvetica-Bold')
            .text('Costa', marginLeft + 45, currentY + 40);

        currentY += tituloHeight + 2; // Espacio entre secciones

        // ============ SEGUNDA SECCIÓN: DATOS DEL ESTUDIANTE ============
        const datosHeight = 50; // ✅ Reducido (antes era 65)

        doc
            .rect(marginLeft, currentY, encabezadoWidth, datosHeight)
            .lineWidth(1)
            .stroke('#000');

        // "Datos informativos del Estudiante" (centrado)
        doc
            .fontSize(8)
            .font('Helvetica')
            .text(
                'Datos informativos del Estudiante',
                marginLeft,
                currentY + 5,
                {
                    width: encabezadoWidth,
                    align: 'center'
                }
            );

        currentY += 15;

        // ============ FILA 1: Nombre y Grado/Paralelo ============
        const col1X = marginLeft + 10;
        const col2X = pageWidth / 2 + 30;

        doc
            .fontSize(7)
            .font('Helvetica')
            .text('Nombre:', col1X, currentY);

        doc
            .font('Helvetica-Bold')
            .text(datos.estudiante.nombres_completos.toUpperCase(), col1X + 40, currentY, {
                width: 200
            });

        doc
            .font('Helvetica')
            .text('Grado/Paralelo:', col2X, currentY);

        doc
            .font('Helvetica-Bold')
            .text(`${datos.curso.nivel} "${datos.curso.paralelo}"`, col2X + 65, currentY);

        currentY += 12;

        // ============ FILA 2: Modalidad y Año Lectivo ============
        doc
            .fontSize(7)
            .font('Helvetica')
            .text('Modalidad:', col1X, currentY);

        doc
            .font('Helvetica-Bold')
            .text('PRESENCIAL', col1X + 40, currentY);

        doc
            .font('Helvetica')
            .text('Año Lectivo:', col2X, currentY);

        doc
            .font('Helvetica-Bold')
            .text(datos.periodo.nombre, col2X + 50, currentY);

        // Resetear color
        doc.fillColor('#000');
    }
    private dibujarTablaTrimestreCompacta(doc: PDFKit.PDFDocument, datos: DatosLibretaEstudiante) {
        const pageWidth = doc.page.width;
        const marginLeft = 30;
        const marginRight = 30;
        let currentY = 145;

        // ============ TÍTULO "REPORTE DE CALIFICACIONES" ============
        const tituloTableHeight = 12;
        const tableWidth = pageWidth - marginLeft - marginRight;

        doc
            .rect(marginLeft, currentY, tableWidth, tituloTableHeight)
            .fillOpacity(0.3)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');

        doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text('REPORTE DE CALIFICACIONES', marginLeft, currentY + 3, {
                width: tableWidth,
                align: 'center'
            });

        currentY += tituloTableHeight + 2;

        // ============ DEFINIR ANCHOS DE COLUMNAS ============
        const colWidths = {
            asignatura: 90,
            trimestreCompleto: 180,
            promedioFinal3Trim: 35,
            califSupletorio: 35,
            promedioFinalAnual: 35,
            equivalencia: 40
        };

        const subColWidths = {
            aporte: 50,
            sumativa: 100,
            notaTrimestre: 30
        };

        const microWidths = {
            promedio: 25,
            ponderado70: 25,
            proyectoIntegrador: 25,
            ponderado15_1: 25,
            pruebaEstructurada: 25,
            ponderado15_2: 25,
            notaTotal: 15,
            equivalencia: 15
        };

        const notaPonderadaFinalWidth =
            colWidths.promedioFinal3Trim +
            colWidths.califSupletorio +
            colWidths.promedioFinalAnual +
            colWidths.equivalencia;

        const finalTableWidth =
            colWidths.asignatura +
            (colWidths.trimestreCompleto * 3) +
            notaPonderadaFinalWidth;

        const startX = marginLeft;
        const headerLevel2Height = 10;
        const headerLevel3Height = 50;
        const headerHeight = 12 + headerLevel2Height + headerLevel3Height;

        // ============ DIBUJAR CABECERAS ============
        doc.rect(startX, currentY, colWidths.asignatura, headerHeight).stroke('#000');
        doc.fontSize(7).font('Helvetica-Bold')
            .text('Asignatura', startX + 2, currentY + (headerHeight / 2) - 3, {
                width: colWidths.asignatura - 4,
                align: 'center'
            });

        let xPos = startX + colWidths.asignatura;
        const trimestresNombres = ['PRIMER TRIMESTRE', 'SEGUNDO TRIMESTRE', 'TERCER TRIMESTRE'];

        trimestresNombres.forEach(nombre => {
            doc.rect(xPos, currentY, colWidths.trimestreCompleto, 12).stroke('#000');
            doc.fontSize(6).text(nombre, xPos, currentY + 3, { width: colWidths.trimestreCompleto, align: 'center' });
            xPos += colWidths.trimestreCompleto;
        });

        doc.rect(xPos, currentY, notaPonderadaFinalWidth, 12).stroke('#000');
        doc.text('NOTA PONDERADA FINAL', xPos, currentY + 3, { width: notaPonderadaFinalWidth, align: 'center' });

        currentY += 12;
        xPos = startX + colWidths.asignatura;

        for (let i = 0; i < 3; i++) {
            doc.rect(xPos, currentY, subColWidths.aporte, headerLevel2Height).stroke('#000');
            doc.fontSize(5).text('APORTE', xPos, currentY + 2, { width: subColWidths.aporte, align: 'center' });
            xPos += subColWidths.aporte;

            doc.rect(xPos, currentY, subColWidths.sumativa, headerLevel2Height).stroke('#000');
            doc.text('SUMATIVA', xPos, currentY + 2, { width: subColWidths.sumativa, align: 'center' });
            xPos += subColWidths.sumativa;

            doc.rect(xPos, currentY, subColWidths.notaTrimestre, headerLevel2Height).stroke('#000');
            doc.text('Nota Trim.', xPos, currentY + 2, { width: subColWidths.notaTrimestre, align: 'center' });
            xPos += subColWidths.notaTrimestre;
        }

        const nivel2y3Height = headerLevel2Height + headerLevel3Height;
        this.dibujarTextoRotado(doc, 'PROMEDIO FINAL (3 TRIM)', xPos, currentY, colWidths.promedioFinal3Trim, nivel2y3Height);
        doc.rect(xPos, currentY, colWidths.promedioFinal3Trim, nivel2y3Height).stroke('#000');
        xPos += colWidths.promedioFinal3Trim;

        this.dibujarTextoRotado(doc, 'CALIF. EXAMEN SUPLETORIO', xPos, currentY, colWidths.califSupletorio, nivel2y3Height);
        doc.rect(xPos, currentY, colWidths.califSupletorio, nivel2y3Height).stroke('#000');
        xPos += colWidths.califSupletorio;

        this.dibujarTextoRotado(doc, 'PROMEDIO FINAL ANUAL', xPos, currentY, colWidths.promedioFinalAnual, nivel2y3Height);
        doc.rect(xPos, currentY, colWidths.promedioFinalAnual, nivel2y3Height).stroke('#000');
        xPos += colWidths.promedioFinalAnual;

        this.dibujarTextoRotado(doc, 'EQUIVALENCIA', xPos, currentY, colWidths.equivalencia, nivel2y3Height);
        doc.rect(xPos, currentY, colWidths.equivalencia, nivel2y3Height).stroke('#000');

        currentY += headerLevel2Height;
        xPos = startX + colWidths.asignatura;

        for (let i = 0; i < 3; i++) {
            const micros = [
                { t: 'PROMEDIO', w: microWidths.promedio },
                { t: '70%', w: microWidths.ponderado70 },
                { t: 'PROYECTO', w: microWidths.proyectoIntegrador },
                { t: '15%', w: microWidths.ponderado15_1 },
                { t: 'EXAMEN', w: microWidths.pruebaEstructurada },
                { t: '15%', w: microWidths.ponderado15_2 },
                { t: 'NOTA TOTAL', w: microWidths.notaTotal },
                { t: 'EQUIV', w: microWidths.equivalencia }
            ];
            micros.forEach(m => {
                this.dibujarTextoRotado(doc, m.t, xPos, currentY, m.w, headerLevel3Height);
                doc.rect(xPos, currentY, m.w, headerLevel3Height).stroke('#000');
                xPos += m.w;
            });
        }

        currentY += headerLevel3Height;

        // ============ FILAS DE MATERIAS ============
        const todasMaterias = Array.from(new Set(datos.trimestres.flatMap(t => t.materias.map(m => m.materia_nombre))));

        todasMaterias.forEach(materiaNombre => {
            const rowHeight = 10;
            doc.rect(startX, currentY, colWidths.asignatura, rowHeight).stroke('#000');
            doc.fontSize(5).font('Helvetica').text(materiaNombre, startX + 2, currentY + 2, { width: colWidths.asignatura - 4, ellipsis: true });

            xPos = startX + colWidths.asignatura;

            for (let i = 1; i <= 3; i++) {
                const mat = datos.trimestres.find(t => t.trimestre_numero === i)?.materias.find(m => m.materia_nombre === materiaNombre);
                const vals = [
                    mat?.promedio_insumos, mat?.ponderado_insumos, mat?.nota_proyecto,
                    mat?.ponderado_proyecto, mat?.nota_examen, mat?.ponderado_examen, mat?.nota_final
                ];
                const widths = [
                    microWidths.promedio, microWidths.ponderado70, microWidths.proyectoIntegrador,
                    microWidths.ponderado15_1, microWidths.pruebaEstructurada, microWidths.ponderado15_2, microWidths.notaTotal
                ];

                vals.forEach((v, idx) => {
                    doc.rect(xPos, currentY, widths[idx], rowHeight).stroke('#000');
                    doc.text(v != null ? v.toFixed(2) : '-', xPos, currentY + 2, { width: widths[idx], align: 'center' });
                    xPos += widths[idx];
                });

                doc.rect(xPos, currentY, microWidths.equivalencia, rowHeight).stroke('#000');
                doc.text(mat?.cualitativa || '-', xPos, currentY + 2, { width: microWidths.equivalencia, align: 'center' });
                xPos += microWidths.equivalencia;
            }

            const promAnual = datos.promedios_anuales?.find(p => p.materia_nombre === materiaNombre);

            // 1. Promedio Anual (3 Trimestres)
            doc.rect(xPos, currentY, colWidths.promedioFinal3Trim, rowHeight).stroke('#000');
            doc.text(promAnual ? promAnual.promedio_anual.toFixed(2) : '-', xPos, currentY + 2, { width: colWidths.promedioFinal3Trim, align: 'center' });
            xPos += colWidths.promedioFinal3Trim;

            // 2. Supletorio
            doc.rect(xPos, currentY, colWidths.califSupletorio, rowHeight).stroke('#000');
            doc.text(promAnual?.nota_supletorio ? promAnual.nota_supletorio.toFixed(2) : '-', xPos, currentY + 2, { width: colWidths.califSupletorio, align: 'center' });
            xPos += colWidths.califSupletorio;

            // 3. Final Anual
            doc.rect(xPos, currentY, colWidths.promedioFinalAnual, rowHeight).stroke('#000');
            const notaF = promAnual?.promedio_final ?? promAnual?.promedio_anual;
            doc.text(notaF ? notaF.toFixed(2) : '-', xPos, currentY + 2, { width: colWidths.promedioFinalAnual, align: 'center' });
            xPos += colWidths.promedioFinalAnual;

            // 4. Equivalencia Final
            doc.rect(xPos, currentY, colWidths.equivalencia, rowHeight).stroke('#000');
            doc.text(promAnual?.cualitativa_final || promAnual?.cualitativa || '-', xPos, currentY + 2, { width: colWidths.equivalencia, align: 'center' });

            currentY += rowHeight;
        });

        // ============ FILA DE PROMEDIOS (CORREGIDO) ============
        const rowHeightProm = 10;
        doc.rect(startX, currentY, finalTableWidth, rowHeightProm).fillOpacity(0.2).fill('#CCCCCC').fillOpacity(1).stroke('#000');
        doc.font('Helvetica-Bold').fillColor('#000').text('PROMEDIOS', startX + 2, currentY + 2);

        xPos = startX + colWidths.asignatura;

        for (let i = 1; i <= 3; i++) {
            const trim = datos.trimestres.find(t => t.trimestre_numero === i);
            const totalMat = trim?.materias.length || 1;

            const drawAvg = (sum: number, w: number) => {
                doc.rect(xPos, currentY, w, rowHeightProm).stroke();
                doc.text((sum / totalMat).toFixed(2), xPos, currentY + 2, { width: w, align: 'center' });
                xPos += w;
            };

            drawAvg(trim?.materias.reduce((s, m) => s + (m.promedio_insumos || 0), 0) || 0, microWidths.promedio);
            drawAvg(trim?.materias.reduce((s, m) => s + (m.ponderado_insumos || 0), 0) || 0, microWidths.ponderado70);
            drawAvg(trim?.materias.reduce((s, m) => s + (m.nota_proyecto || 0), 0) || 0, microWidths.proyectoIntegrador);
            drawAvg(trim?.materias.reduce((s, m) => s + (m.ponderado_proyecto || 0), 0) || 0, microWidths.ponderado15_1);
            drawAvg(trim?.materias.reduce((s, m) => s + (m.nota_examen || 0), 0) || 0, microWidths.pruebaEstructurada);
            drawAvg(trim?.materias.reduce((s, m) => s + (m.ponderado_examen || 0), 0) || 0, microWidths.ponderado15_2);

            // Nota Total Trimestre
            doc.rect(xPos, currentY, microWidths.notaTotal, rowHeightProm).stroke();
            doc.text(trim?.promedio_general ? trim.promedio_general.toFixed(2) : '-', xPos, currentY + 2, { width: microWidths.notaTotal, align: 'center' });
            xPos += microWidths.notaTotal;

            // Equiv Trimestre
            doc.rect(xPos, currentY, microWidths.equivalencia, rowHeightProm).stroke();
            doc.text(trim?.cualitativa_general || '-', xPos, currentY + 2, { width: microWidths.equivalencia, align: 'center' });
            xPos += microWidths.equivalencia;
        }

        // --- CAMBIO CLAVE AQUÍ: Separar las dos columnas de promedios finales ---

        // 1. Promedio Final (3 TRIM) -> Ahora usa promedio_general_trimestres (Ej: 7.12)
        doc.rect(xPos, currentY, colWidths.promedioFinal3Trim, rowHeightProm).stroke();
        doc.text(datos.promedio_general_trimestres ? datos.promedio_general_trimestres.toFixed(2) : '-', xPos, currentY + 2, { width: colWidths.promedioFinal3Trim, align: 'center' });
        xPos += colWidths.promedioFinal3Trim;

        // 2. Espacio de Supletorio (vacío)
        doc.rect(xPos, currentY, colWidths.califSupletorio, rowHeightProm).stroke();
        doc.text('-', xPos, currentY + 2, { width: colWidths.califSupletorio, align: 'center' });
        xPos += colWidths.califSupletorio;

        // 3. Promedio Final Anual -> Usa promedio_general_anual (Ej: 7.17)
        doc.rect(xPos, currentY, colWidths.promedioFinalAnual, rowHeightProm).stroke();
        doc.text(datos.promedio_general_anual ? datos.promedio_general_anual.toFixed(2) : '-', xPos, currentY + 2, { width: colWidths.promedioFinalAnual, align: 'center' });
        xPos += colWidths.promedioFinalAnual;

        // 4. Equivalencia General
        doc.rect(xPos, currentY, colWidths.equivalencia, rowHeightProm).stroke();
        doc.text(datos.cualitativa_general_anual || '-', xPos, currentY + 2, { width: colWidths.equivalencia, align: 'center' });

        currentY += rowHeightProm + 15;

        // Determinar si llamar a Básica o Bachillerato
        const nivelesBasica = ['OCTAVO', 'NOVENO', 'DECIMO'];
        if (nivelesBasica.some(n => datos.curso.nivel.includes(n))) {
            this.dibujarComponentesEducativosBasica(doc, datos, currentY);
        } else {
            this.dibujarComponentesEducativosBachillerato(doc, datos, currentY);
        }
    }
    // ==================== COMPONENTES EDUCATIVOS PARA BÁSICA ====================
    private dibujarComponentesEducativosBasica(doc: PDFKit.PDFDocument, datos: DatosLibretaEstudiante, startY: number) {
        const marginLeft = 30;
        const pageWidth = doc.page.width;
        const marginRight = 30;

        let currentY = startY - 8;

        // ============ SEPARAR COMPORTAMIENTO DE OTROS COMPONENTES ============
        const comportamiento = datos.componentes_cualitativos.componentes.find(c => c.es_comportamiento);
        const otrosComponentes = datos.componentes_cualitativos.componentes.filter(c => !c.es_comportamiento);

        // ============ DIMENSIONES DE LAS TABLAS (LADO A LADO) ============
        const tabla1Width = 380;
        const tabla2Width = 370;
        const espacioEntreTables = 10;

        const rowHeight = 12;

        const tabla1X = marginLeft;
        const tabla2X = marginLeft + tabla1Width + espacioEntreTables;

        // ============ TABLA 1: EVALUACIÓN COMPORTAMENTAL ============
        let xPos = tabla1X;

        // Título
        doc.rect(xPos, currentY, tabla1Width, rowHeight)
            .fillOpacity(0.2)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');

        doc.fontSize(7).font('Helvetica-Bold').fillColor('#000')
            .text('EVALUACIÓN COMPORTAMENTAL', xPos, currentY + 3, {
                width: tabla1Width,
                align: 'center'
            });

        currentY += rowHeight;

        // ✅ Usar datos reales de comportamiento
        if (comportamiento) {
            const col1Width = 280;
            const calificacionWidth = 100;

            const filas = [
                { nombre: 'Primer trimestre', calificacion: comportamiento.calificaciones.trimestre_1 || '-' },
                { nombre: 'Segundo trimestre', calificacion: comportamiento.calificaciones.trimestre_2 || '-' },
                { nombre: 'Tercer trimestre', calificacion: comportamiento.calificaciones.trimestre_3 || '-' },
                { nombre: 'Comportamiento final', calificacion: comportamiento.calificaciones.promedio_anual || '-' }
            ];

            filas.forEach((fila) => {
                xPos = tabla1X;

                // Columna nombre
                doc.rect(xPos, currentY, col1Width, rowHeight).stroke('#000');
                doc.fontSize(6).font('Helvetica')
                    .text(fila.nombre, xPos + 5, currentY + 3, { width: col1Width - 10 });
                xPos += col1Width;

                // Columna calificación
                doc.rect(xPos, currentY, calificacionWidth, rowHeight).stroke('#000');
                doc.text(fila.calificacion, xPos, currentY + 3, { width: calificacionWidth, align: 'center' });

                currentY += rowHeight;
            });
        }

        // ============ TABLA 2: OTROS COMPONENTES EDUCATIVOS ============
        currentY = startY - 8; // Resetear a la misma altura inicial

        const t2Col1Width = 100;
        const t2TrimestreWidth = 60;
        const t2PromedioWidth = 70;

        xPos = tabla2X;

        // Encabezado tabla 2
        doc.rect(xPos, currentY, t2Col1Width, rowHeight).stroke('#000');
        doc.fontSize(6).font('Helvetica-Bold')
            .text('COMPONENTE', xPos, currentY + 3, { width: t2Col1Width, align: 'center' });
        xPos += t2Col1Width;

        doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
        doc.fontSize(5).text('1T', xPos, currentY + 3, { width: t2TrimestreWidth, align: 'center' });
        xPos += t2TrimestreWidth;

        doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
        doc.text('2T', xPos, currentY + 3, { width: t2TrimestreWidth, align: 'center' });
        xPos += t2TrimestreWidth;

        doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
        doc.text('3T', xPos, currentY + 3, { width: t2TrimestreWidth, align: 'center' });
        xPos += t2TrimestreWidth;

        doc.rect(xPos, currentY, t2PromedioWidth, rowHeight).stroke('#000');
        doc.text('PROMEDIO', xPos, currentY + 3, { width: t2PromedioWidth, align: 'center' });

        currentY += rowHeight;

        // ✅ Usar datos reales de otros componentes
        otrosComponentes.forEach((componente) => {
            xPos = tabla2X;

            // Nombre componente
            doc.rect(xPos, currentY, t2Col1Width, rowHeight).stroke('#000');
            doc.fontSize(4.5).font('Helvetica')
                .text(componente.materia_nombre, xPos + 2, currentY + 3, {
                    width: t2Col1Width - 4,
                    lineBreak: false,
                    ellipsis: true
                });
            xPos += t2Col1Width;

            // Trimestre 1
            doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
            doc.fontSize(6).text(componente.calificaciones.trimestre_1 || '-', xPos, currentY + 3, {
                width: t2TrimestreWidth,
                align: 'center'
            });
            xPos += t2TrimestreWidth;

            // Trimestre 2
            doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
            doc.text(componente.calificaciones.trimestre_2 || '-', xPos, currentY + 3, {
                width: t2TrimestreWidth,
                align: 'center'
            });
            xPos += t2TrimestreWidth;

            // Trimestre 3
            doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
            doc.text(componente.calificaciones.trimestre_3 || '-', xPos, currentY + 3, {
                width: t2TrimestreWidth,
                align: 'center'
            });
            xPos += t2TrimestreWidth;

            // Promedio
            doc.rect(xPos, currentY, t2PromedioWidth, rowHeight).stroke('#000');
            doc.text(componente.calificaciones.promedio_anual || '-', xPos, currentY + 3, {
                width: t2PromedioWidth,
                align: 'center'
            });

            currentY += rowHeight;
        });

        // ✅ Agregar filas vacías si es necesario para igualar altura con tabla 1
        const filasTabla1 = 4; // 3 trimestres + final
        const filasTabla2 = otrosComponentes.length;
        const filasVacias = Math.max(0, filasTabla1 - filasTabla2);

        for (let i = 0; i < filasVacias; i++) {
            xPos = tabla2X;

            doc.rect(xPos, currentY, t2Col1Width, rowHeight).stroke('#000');
            xPos += t2Col1Width;

            doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
            xPos += t2TrimestreWidth;

            doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
            xPos += t2TrimestreWidth;

            doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
            xPos += t2TrimestreWidth;

            doc.rect(xPos, currentY, t2PromedioWidth, rowHeight).stroke('#000');

            currentY += rowHeight;
        }
    }

    // ==================== COMPONENTES EDUCATIVOS PARA BACHILLERATO ====================
    private dibujarComponentesEducativosBachillerato(doc: PDFKit.PDFDocument, datos: DatosLibretaEstudiante, startY: number) {
        const marginLeft = 30;
        const pageWidth = doc.page.width;
        const marginRight = 30;

        let currentY = startY - 8;

        // ============ SEPARAR COMPORTAMIENTO DE OTROS COMPONENTES ============
        const comportamiento = datos.componentes_cualitativos.componentes.find(c => c.es_comportamiento);
        const otrosComponentes = datos.componentes_cualitativos.componentes.filter(c => !c.es_comportamiento);

        // ============ DIMENSIONES - DOS TABLAS LADO A LADO ============
        const tabla1Width = 280;  // Ancho tabla COMPORTAMIENTO
        const tabla2Width = 280;  // Ancho tabla COMPONENTES EDUCATIVOS
        const espacioEntreTables = 215;

        const rowHeight = 12;

        const tabla1X = marginLeft;
        const tabla2X = marginLeft + tabla1Width + espacioEntreTables;

        // ============ TABLA 1: COMPORTAMIENTO (IZQUIERDA) ============
        if (comportamiento) {
            let xPos = tabla1X;

            // Anchos de columnas tabla 1
            const t1Col1Width = 100;
            const t1Col2Width = 45;  // 1T
            const t1Col3Width = 45;  // 2T
            const t1Col4Width = 45;  // 3T
            const t1Col5Width = 45;  // PROMEDIO

            // Título
            doc.rect(xPos, currentY, tabla1Width, rowHeight)
                .fillOpacity(0.2)
                .fill('#CCCCCC')
                .fillOpacity(1)
                .stroke('#000');

            doc.fontSize(7).font('Helvetica-Bold').fillColor('#000')
                .text('COMPORTAMIENTO', xPos, currentY + 3, {
                    width: tabla1Width,
                    align: 'center'
                });

            let yPos = currentY + rowHeight;

            // Encabezado
            xPos = tabla1X;

            doc.rect(xPos, yPos, t1Col1Width, rowHeight).stroke('#000');
            doc.fontSize(6).font('Helvetica-Bold')
                .text('COMPONENTE', xPos, yPos + 3, { width: t1Col1Width, align: 'center' });
            xPos += t1Col1Width;

            doc.rect(xPos, yPos, t1Col2Width, rowHeight).stroke('#000');
            doc.fontSize(5).text('1T', xPos, yPos + 3, { width: t1Col2Width, align: 'center' });
            xPos += t1Col2Width;

            doc.rect(xPos, yPos, t1Col3Width, rowHeight).stroke('#000');
            doc.text('2T', xPos, yPos + 3, { width: t1Col3Width, align: 'center' });
            xPos += t1Col3Width;

            doc.rect(xPos, yPos, t1Col4Width, rowHeight).stroke('#000');
            doc.text('3T', xPos, yPos + 3, { width: t1Col4Width, align: 'center' });
            xPos += t1Col4Width;

            doc.rect(xPos, yPos, t1Col5Width, rowHeight).stroke('#000');
            doc.text('PROMEDIO', xPos, yPos + 3, { width: t1Col5Width, align: 'center' });

            yPos += rowHeight;

            // Fila de datos
            xPos = tabla1X;

            doc.rect(xPos, yPos, t1Col1Width, rowHeight).stroke('#000');
            doc.fontSize(5).font('Helvetica')
                .text(comportamiento.materia_nombre, xPos + 5, yPos + 3, {
                    width: t1Col1Width - 10,
                    lineBreak: false,
                    ellipsis: true
                });
            xPos += t1Col1Width;

            // 1T
            doc.rect(xPos, yPos, t1Col2Width, rowHeight).stroke('#000');
            doc.fontSize(6).text(comportamiento.calificaciones.trimestre_1 || '-', xPos, yPos + 3, {
                width: t1Col2Width,
                align: 'center'
            });
            xPos += t1Col2Width;

            // 2T
            doc.rect(xPos, yPos, t1Col3Width, rowHeight).stroke('#000');
            doc.text(comportamiento.calificaciones.trimestre_2 || '-', xPos, yPos + 3, {
                width: t1Col3Width,
                align: 'center'
            });
            xPos += t1Col3Width;

            // 3T
            doc.rect(xPos, yPos, t1Col4Width, rowHeight).stroke('#000');
            doc.text(comportamiento.calificaciones.trimestre_3 || '-', xPos, yPos + 3, {
                width: t1Col4Width,
                align: 'center'
            });
            xPos += t1Col4Width;

            // PROMEDIO
            doc.rect(xPos, yPos, t1Col5Width, rowHeight).stroke('#000');
            doc.text(comportamiento.calificaciones.promedio_anual || '-', xPos, yPos + 3, {
                width: t1Col5Width,
                align: 'center'
            });
        }

        // ============ TABLA 2: COMPONENTES EDUCATIVOS (DERECHA) ============
        if (otrosComponentes.length > 0) {
            let xPos = tabla2X;

            // Anchos de columnas tabla 2
            const t2Col1Width = 100;
            const t2Col2Width = 45;  // 1T
            const t2Col3Width = 45;  // 2T
            const t2Col4Width = 45;  // 3T
            const t2Col5Width = 45;  // PROMEDIO

            // Título
            doc.rect(xPos, currentY, tabla2Width, rowHeight)
                .fillOpacity(0.2)
                .fill('#CCCCCC')
                .fillOpacity(1)
                .stroke('#000');

            doc.fontSize(7).font('Helvetica-Bold').fillColor('#000')
                .text('COMPONENTES EDUCATIVOS', xPos, currentY + 3, {
                    width: tabla2Width,
                    align: 'center'
                });

            let yPos = currentY + rowHeight;

            // Encabezado
            xPos = tabla2X;

            doc.rect(xPos, yPos, t2Col1Width, rowHeight).stroke('#000');
            doc.fontSize(6).font('Helvetica-Bold')
                .text('COMPONENTE', xPos, yPos + 3, { width: t2Col1Width, align: 'center' });
            xPos += t2Col1Width;

            doc.rect(xPos, yPos, t2Col2Width, rowHeight).stroke('#000');
            doc.fontSize(5).text('1T', xPos, yPos + 3, { width: t2Col2Width, align: 'center' });
            xPos += t2Col2Width;

            doc.rect(xPos, yPos, t2Col3Width, rowHeight).stroke('#000');
            doc.text('2T', xPos, yPos + 3, { width: t2Col3Width, align: 'center' });
            xPos += t2Col3Width;

            doc.rect(xPos, yPos, t2Col4Width, rowHeight).stroke('#000');
            doc.text('3T', xPos, yPos + 3, { width: t2Col4Width, align: 'center' });
            xPos += t2Col4Width;

            doc.rect(xPos, yPos, t2Col5Width, rowHeight).stroke('#000');
            doc.text('PROMEDIO', xPos, yPos + 3, { width: t2Col5Width, align: 'center' });

            yPos += rowHeight;

            // Filas de datos
            otrosComponentes.forEach((componente) => {
                xPos = tabla2X;

                // Nombre
                doc.rect(xPos, yPos, t2Col1Width, rowHeight).stroke('#000');
                doc.fontSize(5).font('Helvetica')
                    .text(componente.materia_nombre, xPos + 5, yPos + 3, {
                        width: t2Col1Width - 10,
                        lineBreak: false,
                        ellipsis: true
                    });
                xPos += t2Col1Width;

                // 1T
                doc.rect(xPos, yPos, t2Col2Width, rowHeight).stroke('#000');
                doc.fontSize(6).text(componente.calificaciones.trimestre_1 || '-', xPos, yPos + 3, {
                    width: t2Col2Width,
                    align: 'center'
                });
                xPos += t2Col2Width;

                // 2T
                doc.rect(xPos, yPos, t2Col3Width, rowHeight).stroke('#000');
                doc.text(componente.calificaciones.trimestre_2 || '-', xPos, yPos + 3, {
                    width: t2Col3Width,
                    align: 'center'
                });
                xPos += t2Col3Width;

                // 3T
                doc.rect(xPos, yPos, t2Col4Width, rowHeight).stroke('#000');
                doc.text(componente.calificaciones.trimestre_3 || '-', xPos, yPos + 3, {
                    width: t2Col4Width,
                    align: 'center'
                });
                xPos += t2Col4Width;

                // PROMEDIO
                doc.rect(xPos, yPos, t2Col5Width, rowHeight).stroke('#000');
                doc.text(componente.calificaciones.promedio_anual || '-', xPos, yPos + 3, {
                    width: t2Col5Width,
                    align: 'center'
                });

                yPos += rowHeight;
            });
        }
    }

    // Método auxiliar para dibujar texto rotado -90 grados (CENTRADO VERTICALMENTE)
    private dibujarTextoRotado(
        doc: PDFKit.PDFDocument,
        texto: string,
        x: number,
        y: number,
        width: number,
        height: number
    ) {
        doc.save();

        // ✅ CENTRAR VERTICALMENTE en la celda
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        doc
            .translate(centerX, centerY)
            .rotate(-90, { origin: [0, 0] })
            .fontSize(5)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text(texto, -(height / 2) + 5, -2, {
                width: height - 10,
                align: 'center'
            });

        doc.restore();
    }

    private dibujarEscalas(doc: PDFKit.PDFDocument, datos: DatosLibretaEstudiante) {
        const marginLeft = 30;
        const pageWidth = doc.page.width;
        const marginRight = 30;

        let currentY = 463; // ✅ Ajustado para mejor distribución

        // ============ DIMENSIONES DE LA TABLA (CENTRADA Y MÁS COMPACTA) ============
        const tablaWidth = 480;
        const startX = (pageWidth - tablaWidth) / 2;

        const rowHeight = 11; // ✅ Reducido de 12 a 11
        const headerHeight = 11; // ✅ Reducido de 12 a 11

        // ✅ Proporciones: 66% para CUALITATIVA, 34% para CUANTITATIVA
        const cualitativaWidth = tablaWidth * 0.66;
        const cuantitativaWidth = tablaWidth * 0.34;

        // Columnas sección izquierda (ESCALA CUALITATIVA)
        const col1Width = 40;
        const col2Width = cualitativaWidth - col1Width;

        // ============ ENCABEZADOS (SIN FONDO GRIS, SOLO TABLA) ============
        let xPos = startX;

        // Header ESCALA CUALITATIVA
        doc.rect(xPos, currentY, cualitativaWidth, headerHeight)
            .stroke('#000');

        doc.fontSize(6).font('Helvetica-Bold').fillColor('#000')
            .text('ESCALA CUALITATIVA:', xPos + 5, currentY + 2);

        xPos += cualitativaWidth;

        // Header ESCALA CUANTITATIVA
        doc.rect(xPos, currentY, cuantitativaWidth, headerHeight)
            .stroke('#000');

        doc.fontSize(6).font('Helvetica-Bold')
            .text('ESCALA CUANTITATIVA:', xPos + 5, currentY + 2);

        currentY += headerHeight;

        // ============ FILAS DE DATOS ============
        const escalas = [
            {
                codigo: 'DA',
                descripcion: 'Domina los aprendizajes requeridos',
                rango: '9.00 - 10.00'
            },
            {
                codigo: 'AA',
                descripcion: 'Alcanza los aprendizajes requeridos',
                rango: '7.00 - 8.99'
            },
            {
                codigo: 'PA',
                descripcion: 'Próximo a alcanzar los aprendizajes requeridos',
                rango: '4.01 - 6.99'
            },
            {
                codigo: 'NA',
                descripcion: 'No alcanza los aprendizajes requeridos',
                rango: '<= 4.00'
            }
        ];

        escalas.forEach((escala) => {
            xPos = startX;

            // Sección izquierda: Código
            doc.rect(xPos, currentY, col1Width, rowHeight).stroke('#000');
            doc.fontSize(6).font('Helvetica-Bold')
                .text(escala.codigo, xPos, currentY + 2, {
                    width: col1Width,
                    align: 'center'
                });
            xPos += col1Width;

            // Sección izquierda: Descripción
            doc.rect(xPos, currentY, col2Width, rowHeight).stroke('#000');
            doc.fontSize(5.5).font('Helvetica')
                .text(escala.descripcion, xPos + 3, currentY + 2, {
                    width: col2Width - 6
                });
            xPos += col2Width;

            // Sección derecha: Rango numérico (centrado)
            doc.rect(xPos, currentY, cuantitativaWidth, rowHeight).stroke('#000');
            doc.fontSize(6).font('Helvetica')
                .text(escala.rango, xPos, currentY + 2, {
                    width: cuantitativaWidth,
                    align: 'center'
                });

            currentY += rowHeight;
        });
    }

    private dibujarObservacionesYFirmas(doc: PDFKit.PDFDocument, datos: DatosLibretaEstudiante) {
        const pageWidth = doc.page.width;
        const marginLeft = 30;
        const marginRight = 30;

        let currentY = 532;

        // ============ OBSERVACIONES ============
        doc.fontSize(7).font('Helvetica').fillColor('#000');

        doc.text('Observaciones:', marginLeft, currentY, {
            continued: false,
            lineBreak: false
        });

        // Línea para escribir observaciones
        doc.moveTo(marginLeft + 75, currentY + 8)
            .lineTo(pageWidth - marginRight, currentY + 8)
            .stroke('#000');

        currentY += 30; // ✅ Aumentado de 22 a 30 para más espacio

        // ============ FIRMAS (3 en línea horizontal) ============
        const firmaWidth = 120;
        const espacioEntreFirmas = 100;

        const totalWidth = (firmaWidth * 3) + (espacioEntreFirmas * 2);
        const startX = (pageWidth - totalWidth) / 2;

        const firma1X = startX;
        const firma2X = startX + firmaWidth + espacioEntreFirmas;
        const firma3X = startX + (firmaWidth + espacioEntreFirmas) * 2;

        // Líneas de firma
        const lineWidth = 90;
        const lineOffset = (firmaWidth - lineWidth) / 2;

        doc.moveTo(firma1X + lineOffset, currentY)
            .lineTo(firma1X + lineOffset + lineWidth, currentY)
            .stroke('#000');

        doc.moveTo(firma2X + lineOffset, currentY)
            .lineTo(firma2X + lineOffset + lineWidth, currentY)
            .stroke('#000');

        doc.moveTo(firma3X + lineOffset, currentY)
            .lineTo(firma3X + lineOffset + lineWidth, currentY)
            .stroke('#000');

        // Textos EN LA MISMA ALTURA
        const textY = currentY + 5;

        doc.fontSize(6).font('Helvetica').fillColor('#000');

        const text1 = 'RECTOR(A) / DIRECTOR(A)';
        const text1Width = doc.widthOfString(text1);
        doc.text(text1, firma1X + (firmaWidth - text1Width) / 2, textY, {
            lineBreak: false,
            continued: false
        });

        const text2 = 'DOCENTE TUTOR';
        const text2Width = doc.widthOfString(text2);
        doc.text(text2, firma2X + (firmaWidth - text2Width) / 2, textY, {
            lineBreak: false,
            continued: false
        });

        const text3 = 'REPRESENTANTE';
        const text3Width = doc.widthOfString(text3);
        doc.text(text3, firma3X + (firmaWidth - text3Width) / 2, textY, {
            lineBreak: false,
            continued: false
        });
    }

    // ==================== MÉTODOS DE REPORTE DE MATERIA ====================



    private dibujarEncabezadoReporteMateria(doc: PDFKit.PDFDocument, datos: DatosReporteMateria) {
        const pageWidth = doc.page.width;
        const marginLeft = 30;
        const marginRight = 30;
        const encabezadoWidth = pageWidth - marginLeft - marginRight;
        let currentY = 30;

        // ============ NOMBRE DE LA INSTITUCIÓN ============
        doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text(
                'UNIDAD EDUCATIVA FISCAL CINCO DE JUNIO',
                marginLeft,
                currentY,
                {
                    width: encabezadoWidth,
                    align: 'center'
                }
            );

        currentY += 18;

        // ============ CUADRO DE CALIFICACIONES ============
        doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(
                'CUADRO DE CALIFICACIONES',
                marginLeft,
                currentY,
                {
                    width: encabezadoWidth,
                    align: 'center'
                }
            );

        currentY += 15;

        // ============ NOTA DEL {TRIMESTRE} ============
        const nombreTrimestre = datos.trimestre.nombre.toUpperCase();
        doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .text(
                `NOTA DEL ${nombreTrimestre}`,
                marginLeft,
                currentY,
                {
                    width: encabezadoWidth,
                    align: 'center'
                }
            );

        currentY += 15;

        // ============ PERÍODO (Ej: 2024-2025) ============
        doc
            .fontSize(9)
            .font('Helvetica')
            .text(
                `${datos.periodo.nombre}`,
                marginLeft,
                currentY,
                {
                    width: encabezadoWidth,
                    align: 'center'
                }
            );

        currentY += 20;

        // ============ ASIGNATURA (CENTRADA) ============
        const asignaturaTexto = `ASIGNATURA:     ${datos.materia.nombre.toUpperCase()}`;
        doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .text(
                asignaturaTexto,
                marginLeft,
                currentY,
                {
                    width: encabezadoWidth,
                    align: 'center'
                }
            );

        currentY += 15;

        // ============ CURSO Y DOCENTE (CENTRADA EN UNA SOLA LÍNEA) ============
        const cursoTexto = `${datos.curso.nivel} "${datos.curso.paralelo}"`;
        const docenteNombre = datos.docente
            ? `${datos.docente.apellidos} ${datos.docente.nombres}`.toUpperCase()
            : 'SIN ASIGNAR';

        const lineaCompleta = `CURSO:  ${cursoTexto}                    DOCENTE:  ${docenteNombre}`;

        doc
            .fontSize(9)
            .font('Helvetica')
            .text(
                lineaCompleta,
                marginLeft,
                currentY,
                {
                    width: encabezadoWidth,
                    align: 'center'
                }
            );

        currentY += 25;

        // Guardar posición Y para la siguiente fase
        doc.y = currentY;

        // Resetear color
        doc.fillColor('#000');
    }

    /**
     * FASE 2: Dibuja la tabla de calificaciones
     */
    private dibujarTablaCalificacionesMateria(doc: PDFKit.PDFDocument, datos: DatosReporteMateria) {
        const pageWidth = doc.page.width;
        const marginLeft = 30;
        const marginRight = 30;
        let currentY = doc.y;

        // ============ DEFINIR ANCHOS DE COLUMNAS (OPTIMIZADO) ============
        const colWidths = {
            numero: 20,           // N°
            nomina: 180,          // NÓMINA (ampliado de 150 a 180)
            promedio: 38,         // PROMEDIO (ampliado de 35 a 38)
            ponderado70: 38,      // 70% (ampliado de 35 a 38)
            proyecto: 38,         // PROYECTO INTEGRADOR (ampliado)
            ponderado15_1: 38,    // 15%
            prueba: 38,           // PRUEBA ESTRUCTURADA (ampliado)
            ponderado15_2: 38,    // 15%
            notaTrimestre: 40,    // NOTA {TRIMESTRE} (ampliado)
            cualitativa: 35       // CUALITATIVA
        };

        const tableWidth = Object.values(colWidths).reduce((sum, w) => sum + w, 0);
        const startX = (pageWidth - tableWidth) / 2; // Centrar tabla

        // ============ ALTURA DE ENCABEZADOS ============
        const headerHeight1 = 12;  // Nivel 1: APORTES, SUMATIVA
        const headerHeight2 = 40;  // Nivel 2: Texto rotado (ampliado de 35 a 40)
        const totalHeaderHeight = headerHeight1 + headerHeight2;

        let xPos = startX;

        // ============ ENCABEZADO NIVEL 1 ============
        // N° (combina ambos niveles)
        doc
            .rect(xPos, currentY, colWidths.numero, totalHeaderHeight)
            .stroke('#000');
        doc
            .fontSize(7)
            .font('Helvetica-Bold')
            .text('N°', xPos, currentY + (totalHeaderHeight / 2) - 3, {
                width: colWidths.numero,
                align: 'center'
            });
        xPos += colWidths.numero;

        // NÓMINA (combina ambos niveles)
        doc
            .rect(xPos, currentY, colWidths.nomina, totalHeaderHeight)
            .stroke('#000');
        doc
            .fontSize(7)
            .font('Helvetica-Bold')
            .text('NÓMINA', xPos, currentY + (totalHeaderHeight / 2) - 3, {
                width: colWidths.nomina,
                align: 'center'
            });
        xPos += colWidths.nomina;

        // APORTES (agrupa PROMEDIO + 70%)
        const aportesWidth = colWidths.promedio + colWidths.ponderado70;
        doc
            .rect(xPos, currentY, aportesWidth, headerHeight1)
            .stroke('#000');
        doc
            .fontSize(7)
            .font('Helvetica-Bold')
            .text('APORTES', xPos, currentY + 3, {
                width: aportesWidth,
                align: 'center'
            });
        xPos += aportesWidth;

        // SUMATIVA (agrupa PROYECTO + 15% + PRUEBA + 15%)
        const sumativaWidth = colWidths.proyecto + colWidths.ponderado15_1 +
            colWidths.prueba + colWidths.ponderado15_2;
        doc
            .rect(xPos, currentY, sumativaWidth, headerHeight1)
            .stroke('#000');
        doc
            .fontSize(7)
            .font('Helvetica-Bold')
            .text('SUMATIVA', xPos, currentY + 3, {
                width: sumativaWidth,
                align: 'center'
            });
        xPos += sumativaWidth;

        // NOTA {TRIMESTRE} (combina ambos niveles, ROTADA)
        const nombreTrimestreCorto = `NOTA ${datos.trimestre.nombre.toUpperCase()}`;
        doc
            .rect(xPos, currentY, colWidths.notaTrimestre, totalHeaderHeight)
            .stroke('#000');
        this.dibujarTextoRotado(doc, nombreTrimestreCorto, xPos, currentY, colWidths.notaTrimestre, totalHeaderHeight);
        xPos += colWidths.notaTrimestre;

        // CUALITATIVA (combina ambos niveles, ROTADA)
        doc
            .rect(xPos, currentY, colWidths.cualitativa, totalHeaderHeight)
            .stroke('#000');
        this.dibujarTextoRotado(doc, 'CUALITATIVA', xPos, currentY, colWidths.cualitativa, totalHeaderHeight);

        currentY += headerHeight1;

        // ============ ENCABEZADO NIVEL 2: Micro-columnas con texto rotado ============
        xPos = startX + colWidths.numero + colWidths.nomina;

        // APORTES: PROMEDIO | 70%
        doc
            .rect(xPos, currentY, colWidths.promedio, headerHeight2)
            .stroke('#000');
        this.dibujarTextoRotado(doc, 'PROMEDIO', xPos, currentY, colWidths.promedio, headerHeight2);
        xPos += colWidths.promedio;

        doc
            .rect(xPos, currentY, colWidths.ponderado70, headerHeight2)
            .stroke('#000');
        this.dibujarTextoRotado(doc, '70%', xPos, currentY, colWidths.ponderado70, headerHeight2);
        xPos += colWidths.ponderado70;

        // SUMATIVA: PROYECTO INTEGRADOR | 15% | PRUEBA ESTRUCTURADA | 15%
        doc
            .rect(xPos, currentY, colWidths.proyecto, headerHeight2)
            .stroke('#000');
        this.dibujarTextoRotado(doc, 'PROYECTO INTEGRADOR', xPos, currentY, colWidths.proyecto, headerHeight2);
        xPos += colWidths.proyecto;

        doc
            .rect(xPos, currentY, colWidths.ponderado15_1, headerHeight2)
            .stroke('#000');
        this.dibujarTextoRotado(doc, '15%', xPos, currentY, colWidths.ponderado15_1, headerHeight2);
        xPos += colWidths.ponderado15_1;

        doc
            .rect(xPos, currentY, colWidths.prueba, headerHeight2)
            .stroke('#000');
        this.dibujarTextoRotado(doc, 'PRUEBA ESTRUCTURADA', xPos, currentY, colWidths.prueba, headerHeight2);
        xPos += colWidths.prueba;

        doc
            .rect(xPos, currentY, colWidths.ponderado15_2, headerHeight2)
            .stroke('#000');
        this.dibujarTextoRotado(doc, '15%', xPos, currentY, colWidths.ponderado15_2, headerHeight2);

        currentY += headerHeight2;

        // ============ FILAS DE ESTUDIANTES ============
        const rowHeight = 10;
        doc.fontSize(6).font('Helvetica');

        datos.calificaciones.forEach((cal, index) => {
            xPos = startX;

            // N°
            doc
                .rect(xPos, currentY, colWidths.numero, rowHeight)
                .stroke('#000');
            doc
                .fillColor('#000')
                .text((index + 1).toString(), xPos, currentY + 3, {
                    width: colWidths.numero,
                    align: 'center'
                });
            xPos += colWidths.numero;

            // NÓMINA
            doc
                .rect(xPos, currentY, colWidths.nomina, rowHeight)
                .stroke('#000');
            doc
                .font('Helvetica')
                .fillColor('#000')
                .text(cal.estudiante_nombre, xPos + 2, currentY + 3, {
                    width: colWidths.nomina - 4,
                    ellipsis: true,
                    lineBreak: false
                });
            xPos += colWidths.nomina;

            // ✅ PROMEDIO INSUMOS (rojo si < 7)
            doc
                .rect(xPos, currentY, colWidths.promedio, rowHeight)
                .stroke('#000');
            const colorPromedio = (cal.promedio_insumos !== null && cal.promedio_insumos < 7) ? '#FF0000' : '#000';
            doc
                .font('Helvetica-Bold')
                .fillColor(colorPromedio)
                .text(
                    cal.promedio_insumos !== null ? cal.promedio_insumos.toFixed(2) : '-',
                    xPos,
                    currentY + 3,
                    { width: colWidths.promedio, align: 'center' }
                );
            xPos += colWidths.promedio;

            // PONDERADO 70% INSUMOS
            doc
                .rect(xPos, currentY, colWidths.ponderado70, rowHeight)
                .stroke('#000');
            doc
                .fillColor('#000')
                .text(
                    cal.ponderado_insumos !== null ? cal.ponderado_insumos.toFixed(2) : '-',
                    xPos,
                    currentY + 3,
                    { width: colWidths.ponderado70, align: 'center' }
                );
            xPos += colWidths.ponderado70;

            // ✅ PROYECTO (rojo si < 7)
            doc
                .rect(xPos, currentY, colWidths.proyecto, rowHeight)
                .stroke('#000');
            const colorProyecto = (cal.nota_proyecto !== null && cal.nota_proyecto < 7) ? '#FF0000' : '#000';
            doc
                .fillColor(colorProyecto)
                .text(
                    cal.nota_proyecto !== null ? cal.nota_proyecto.toFixed(2) : '-',
                    xPos,
                    currentY + 3,
                    { width: colWidths.proyecto, align: 'center' }
                );
            xPos += colWidths.proyecto;

            // PONDERADO 15% PROYECTO
            doc
                .rect(xPos, currentY, colWidths.ponderado15_1, rowHeight)
                .stroke('#000');
            doc
                .fillColor('#000')
                .text(
                    cal.ponderado_proyecto !== null ? cal.ponderado_proyecto.toFixed(2) : '-',
                    xPos,
                    currentY + 3,
                    { width: colWidths.ponderado15_1, align: 'center' }
                );
            xPos += colWidths.ponderado15_1;

            // ✅ EXAMEN (rojo si < 7)
            doc
                .rect(xPos, currentY, colWidths.prueba, rowHeight)
                .stroke('#000');
            const colorExamen = (cal.nota_examen !== null && cal.nota_examen < 7) ? '#FF0000' : '#000';
            doc
                .fillColor(colorExamen)
                .text(
                    cal.nota_examen !== null ? cal.nota_examen.toFixed(2) : '-',
                    xPos,
                    currentY + 3,
                    { width: colWidths.prueba, align: 'center' }
                );
            xPos += colWidths.prueba;

            // PONDERADO 15% EXAMEN
            doc
                .rect(xPos, currentY, colWidths.ponderado15_2, rowHeight)
                .stroke('#000');
            doc
                .fillColor('#000')
                .text(
                    cal.ponderado_examen !== null ? cal.ponderado_examen.toFixed(2) : '-',
                    xPos,
                    currentY + 3,
                    { width: colWidths.ponderado15_2, align: 'center' }
                );
            xPos += colWidths.ponderado15_2;

            // ✅ NOTA FINAL (rojo si < 7)
            doc
                .rect(xPos, currentY, colWidths.notaTrimestre, rowHeight)
                .stroke('#000');
            const colorFinal = cal.nota_final < 7 ? '#FF0000' : '#000';
            doc
                .fillColor(colorFinal)
                .text(
                    cal.nota_final.toFixed(2),
                    xPos,
                    currentY + 3,
                    { width: colWidths.notaTrimestre, align: 'center' }
                );
            xPos += colWidths.notaTrimestre;

            // CUALITATIVA
            doc
                .rect(xPos, currentY, colWidths.cualitativa, rowHeight)
                .stroke('#000');
            doc
                .fillColor('#000')
                .text(
                    cal.cualitativa,
                    xPos,
                    currentY + 3,
                    { width: colWidths.cualitativa, align: 'center' }
                );

            currentY += rowHeight;
        });

        // ============ FASE 3: FILA DE PROMEDIOS ============
        currentY += 3; // Pequeño espacio

        xPos = startX;

        // N° (vacía)
        doc
            .rect(xPos, currentY, colWidths.numero, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        xPos += colWidths.numero;

        // NÓMINA con texto "PROMEDIOS"
        doc
            .rect(xPos, currentY, colWidths.nomina, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        doc
            .fontSize(7)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text('PROMEDIOS', xPos + 2, currentY + 3, {
                width: colWidths.nomina - 4,
                align: 'left'
            });
        xPos += colWidths.nomina;

        // Calcular promedios
        const calcularPromedio = (campo: keyof typeof datos.calificaciones[0]): number => {
            const valores = datos.calificaciones
                .map(c => c[campo] as number | null)
                .filter(v => v !== null && v !== undefined) as number[];

            if (valores.length === 0) return 0;
            return valores.reduce((sum, v) => sum + v, 0) / valores.length;
        };

        // ✅ PROMEDIO INSUMOS (con valor calculado)
        const promedioInsumos = calcularPromedio('promedio_insumos');
        doc
            .rect(xPos, currentY, colWidths.promedio, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        doc
            .fontSize(6)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text(promedioInsumos.toFixed(2), xPos, currentY + 3, {
                width: colWidths.promedio,
                align: 'center'
            });
        xPos += colWidths.promedio;

        // ❌ PONDERADO 70% (VACÍA - sin promedio)
        doc
            .rect(xPos, currentY, colWidths.ponderado70, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        xPos += colWidths.ponderado70;

        // ✅ PROYECTO INTEGRADOR (con valor calculado)
        const promedioProyecto = calcularPromedio('nota_proyecto');
        doc
            .rect(xPos, currentY, colWidths.proyecto, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        doc
            .fontSize(6)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text(promedioProyecto.toFixed(2), xPos, currentY + 3, {
                width: colWidths.proyecto,
                align: 'center'
            });
        xPos += colWidths.proyecto;

        // ❌ PONDERADO 15% PROYECTO (VACÍA - sin promedio)
        doc
            .rect(xPos, currentY, colWidths.ponderado15_1, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        xPos += colWidths.ponderado15_1;

        // ✅ PRUEBA ESTRUCTURADA (con valor calculado)
        const promedioExamen = calcularPromedio('nota_examen');
        doc
            .rect(xPos, currentY, colWidths.prueba, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        doc
            .fontSize(6)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text(promedioExamen.toFixed(2), xPos, currentY + 3, {
                width: colWidths.prueba,
                align: 'center'
            });
        xPos += colWidths.prueba;

        // ❌ PONDERADO 15% EXAMEN (VACÍA - sin promedio)
        doc
            .rect(xPos, currentY, colWidths.ponderado15_2, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        xPos += colWidths.ponderado15_2;

        // ✅ NOTA {TRIMESTRE} (con valor calculado)
        const promedioFinal = calcularPromedio('nota_final');
        doc
            .rect(xPos, currentY, colWidths.notaTrimestre, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        doc
            .fontSize(6)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text(promedioFinal.toFixed(2), xPos, currentY + 3, {
                width: colWidths.notaTrimestre,
                align: 'center'
            });
        xPos += colWidths.notaTrimestre;

        // CUALITATIVA (vacía)
        doc
            .rect(xPos, currentY, colWidths.cualitativa, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');

        currentY += rowHeight;

        // Guardar posición para la siguiente fase
        doc.y = currentY + 10;

        // Resetear color
        doc.fillColor('#000');
    }

    /**
 * FASE 4: Dibuja tablas de RENDIMIENTO y ESCALA DE CALIFICACIONES + GRÁFICA
 */
    private dibujarRendimientoYEscala(doc: PDFKit.PDFDocument, datos: DatosReporteMateria) {
        const pageWidth = doc.page.width;
        const marginLeft = 30;
        let currentY = doc.y + 10;

        const rowHeight = 10;

        // ============ TABLA 1: RENDIMIENTO DEL {TRIMESTRE} (IZQUIERDA) ============
        const tablaRendimientoWidth = 250;
        const startX = marginLeft;

        // Anchos de columnas
        const colRendimiento = {
            descripcion: 150,
            cantidad: 50,
            porcentaje: 50
        };

        let xPos = startX;

        // Encabezados
        doc.rect(xPos, currentY, colRendimiento.descripcion, rowHeight).stroke('#000');
        doc.fontSize(6).font('Helvetica-Bold').fillColor('#000')
            .text(
                `RENDIMIENTO ${datos.trimestre.nombre.toUpperCase()}`,
                xPos + 2,
                currentY + 2,
                {
                    width: colRendimiento.descripcion - 4,
                    align: 'left'
                }
            );
        xPos += colRendimiento.descripcion;

        doc.rect(xPos, currentY, colRendimiento.cantidad, rowHeight).stroke('#000');
        doc.text('C', xPos, currentY + 2, {
            width: colRendimiento.cantidad,
            align: 'center'
        });
        xPos += colRendimiento.cantidad;

        doc.rect(xPos, currentY, colRendimiento.porcentaje, rowHeight).stroke('#000');
        doc.text('%', xPos, currentY + 2, {
            width: colRendimiento.porcentaje,
            align: 'center'
        });

        currentY += rowHeight;

        // Filas de datos
        const total = datos.estadisticas.total_estudiantes;
        const filas = [
            {
                descripcion: 'Domina los aprendizajes (DA)',
                cantidad: datos.estadisticas.distribucion_cualitativa.DA,
                porcentaje: total > 0 ? (datos.estadisticas.distribucion_cualitativa.DA / total) * 100 : 0
            },
            {
                descripcion: 'Alcanza los aprendizajes (AA)',
                cantidad: datos.estadisticas.distribucion_cualitativa.AA,
                porcentaje: total > 0 ? (datos.estadisticas.distribucion_cualitativa.AA / total) * 100 : 0
            },
            {
                descripcion: 'Está próximo a alcanzar (PA)',
                cantidad: datos.estadisticas.distribucion_cualitativa.PA,
                porcentaje: total > 0 ? (datos.estadisticas.distribucion_cualitativa.PA / total) * 100 : 0
            },
            {
                descripcion: 'No alcanza los aprendizajes (NA)',
                cantidad: datos.estadisticas.distribucion_cualitativa.NA,
                porcentaje: total > 0 ? (datos.estadisticas.distribucion_cualitativa.NA / total) * 100 : 0
            }
        ];

        // Calcular totales
        const totalCantidad = filas.reduce((sum, f) => sum + f.cantidad, 0);
        const totalPorcentaje = filas.reduce((sum, f) => sum + f.porcentaje, 0);

        filas.forEach(fila => {
            xPos = startX;

            // Descripción
            doc.rect(xPos, currentY, colRendimiento.descripcion, rowHeight).stroke('#000');
            doc.fontSize(5).font('Helvetica')
                .text(fila.descripcion, xPos + 2, currentY + 2, {
                    width: colRendimiento.descripcion - 4,
                    ellipsis: true,
                    lineBreak: false
                });
            xPos += colRendimiento.descripcion;

            // ✅ Cantidad (NEGRITA)
            doc.rect(xPos, currentY, colRendimiento.cantidad, rowHeight).stroke('#000');
            doc.fontSize(6).font('Helvetica')
                .text(fila.cantidad.toString(), xPos, currentY + 2, {
                    width: colRendimiento.cantidad,
                    align: 'center'
                });
            xPos += colRendimiento.cantidad;

            // ✅ Porcentaje (NEGRITA)
            doc.rect(xPos, currentY, colRendimiento.porcentaje, rowHeight).stroke('#000');
            doc.font('Helvetica')
                .text(fila.porcentaje.toFixed(2) + '%', xPos, currentY + 2, {
                    width: colRendimiento.porcentaje,
                    align: 'center'
                });

            currentY += rowHeight;
        });

        // Fila TOTAL
        xPos = startX;

        doc.rect(xPos, currentY, colRendimiento.descripcion, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        doc.fontSize(6).font('Helvetica-Bold').fillColor('#000')
            .text('TOTAL', xPos + 2, currentY + 2, {
                width: colRendimiento.descripcion - 4,
                align: 'left'
            });
        xPos += colRendimiento.descripcion;

        doc.rect(xPos, currentY, colRendimiento.cantidad, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        doc.fontSize(6).font('Helvetica-Bold').fillColor('#000')
            .text(totalCantidad.toString(), xPos, currentY + 2, {
                width: colRendimiento.cantidad,
                align: 'center'
            });
        xPos += colRendimiento.cantidad;

        doc.rect(xPos, currentY, colRendimiento.porcentaje, rowHeight)
            .fillOpacity(0.15)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');
        doc.fontSize(6).font('Helvetica-Bold').fillColor('#000')
            .text(totalPorcentaje.toFixed(2) + '%', xPos, currentY + 2, {
                width: colRendimiento.porcentaje,
                align: 'center'
            });

        currentY += rowHeight + 10;

        // ============ TABLA 2: ESCALA DE CALIFICACIONES (IZQUIERDA, DEBAJO DE RENDIMIENTO) ============
        const tablaEscalaWidth = 180; // ✅ Reducido (antes era 250)
        xPos = startX;

        // ✅ Encabezado SIN fondo gris (formato de tabla normal)
        doc.rect(xPos, currentY, tablaEscalaWidth, rowHeight).stroke('#000');
        doc.fontSize(6).font('Helvetica-Bold').fillColor('#000')
            .text('ESCALA DE CALIFICACIONES', xPos + 2, currentY + 2, {
                width: tablaEscalaWidth - 4,
                align: 'center'
            });

        currentY += rowHeight;

        // Filas de escala (sin columnas, solo texto)
        const escalas = [
            'Domina los aprendizajes (DA)             9.00 a 10.00',
            'Alcanza los aprendizajes (AA)            7.00 a 8.99',
            'Está próximo a alcanzar (PA)             4.01 a 6.99',
            'No alcanza los aprendizajes (NA)         Menor a 4'
        ];

        escalas.forEach(escala => {
            doc.rect(xPos, currentY, tablaEscalaWidth, rowHeight).stroke('#000');
            doc.fontSize(5).font('Helvetica')
                .text(escala, xPos + 2, currentY + 2, {
                    width: tablaEscalaWidth - 4,
                    lineBreak: false
                });

            currentY += rowHeight;
        });

        // ============ GRÁFICA DE RENDIMIENTO (DERECHA, AL LADO DE LAS TABLAS) ============
        this.dibujarGraficaRendimiento(doc, datos, filas);

        // Actualizar posición Y para la siguiente fase
        doc.y = currentY + 10;

        // Resetear color
        doc.fillColor('#000');
    }

    /**
     * FASE 5: Dibuja la gráfica de rendimiento (barras verticales)
     */
    private dibujarGraficaRendimiento(
        doc: PDFKit.PDFDocument,
        datos: DatosReporteMateria,
        filas: Array<{ descripcion: string; cantidad: number; porcentaje: number }>
    ) {
        const pageWidth = doc.page.width;
        const marginLeft = 30;

        // Posición de la gráfica (a la derecha de las tablas)
        const graficaX = marginLeft + 250 + 30; // Después de tabla + espacio
        const graficaY = doc.y + 10 - 110; // Alineada con inicio de tablas
        const graficaWidth = 200; // Ancho del área de barras
        const graficaHeight = 80; // Alto de la gráfica (reducido para dejar espacio)
        const leyendaWidth = 100; // Ancho de la leyenda a la derecha

        // ============ TÍTULO DE LA GRÁFICA ============
        doc.fontSize(6).font('Helvetica-Bold').fillColor('#000')
            .text(
                `% RENDIMIENTO ${datos.trimestre.nombre.toUpperCase()}`,
                graficaX,
                graficaY - 10,
                {
                    width: graficaWidth,
                    align: 'center'
                }
            );

        // ============ MARCO DE LA GRÁFICA ============
        doc.rect(graficaX, graficaY, graficaWidth, graficaHeight)
            .stroke('#000');

        // ============ EJES Y LÍNEAS DE CUADRÍCULA ============
        const margenSuperior = 15; // ✅ Espacio para valores de 100%
        const margenInferior = 20; // Espacio para etiqueta del eje X
        const margenIzquierdo = 25; // Espacio para etiquetas del eje Y
        const areaBarrasWidth = graficaWidth - margenIzquierdo - 10;
        const areaBarrasHeight = graficaHeight - margenInferior - margenSuperior;

        // Líneas horizontales de cuadrícula (cada 25%)
        for (let i = 0; i <= 4; i++) {
            const porcentaje = i * 25;
            const lineY = graficaY + margenSuperior + areaBarrasHeight - (areaBarrasHeight * (porcentaje / 100));

            doc.strokeColor('#CCCCCC').lineWidth(0.5)
                .moveTo(graficaX + margenIzquierdo, lineY)
                .lineTo(graficaX + graficaWidth - 10, lineY)
                .stroke();

            // Etiquetas de porcentaje en el eje Y (izquierda)
            doc.fontSize(5).font('Helvetica').fillColor('#666')
                .text(`${porcentaje}%`, graficaX + 2, lineY - 3, {
                    width: margenIzquierdo - 4,
                    align: 'right'
                });
        }

        doc.strokeColor('#000').lineWidth(1); // Restaurar color y grosor

        // ============ COLORES PARA LAS BARRAS ============
        const colores = {
            'DA': '#4A90E2',  // Azul
            'AA': '#F5A623',  // Naranja
            'PA': '#808080',  // Gris
            'NA': '#D4A574'   // Beige
        };

        // ============ DIBUJAR BARRAS VERTICALES ============
        const numBarras = filas.length;
        const barWidth = (areaBarrasWidth / numBarras) * 0.6; // 60% del espacio disponible
        const barSpacing = (areaBarrasWidth / numBarras) * 0.4; // 40% de espacio

        filas.forEach((fila, index) => {
            const codigo = fila.descripcion.match(/\(([A-Z]{2})\)/)?.[1] || 'DA';
            const color = colores[codigo] || '#999';
            const barHeightPx = (fila.porcentaje / 100) * areaBarrasHeight;

            // Posición X de la barra
            const barX = graficaX + margenIzquierdo + (index * (barWidth + (barSpacing / (numBarras - 1 || 1))));
            const barY = graficaY + margenSuperior + areaBarrasHeight - barHeightPx;

            // Dibujar barra vertical
            if (barHeightPx > 0) {
                doc.rect(barX, barY, barWidth, barHeightPx)
                    .fillOpacity(1)
                    .fill(color)
                    .stroke('#000');

                // Etiqueta con porcentaje encima de la barra
                doc.fontSize(5).font('Helvetica-Bold').fillColor('#000')
                    .text(
                        fila.porcentaje.toFixed(2) + '%',
                        barX,
                        barY - 8,
                        {
                            width: barWidth,
                            align: 'center'
                        }
                    );
            } else {
                // Si es 0%, mostrar solo el texto
                doc.fontSize(5).font('Helvetica-Bold').fillColor('#000')
                    .text(
                        '0.00%',
                        barX,
                        barY - 8,
                        {
                            width: barWidth,
                            align: 'center'
                        }
                    );
            }
        });

        // ============ ETIQUETA DEL EJE X (CENTRADA DEBAJO DE LA GRÁFICA) ============
        doc.fontSize(5).font('Helvetica').fillColor('#000')
            .text(
                `RENDIMIENTO ${datos.trimestre.nombre.toUpperCase()}`,
                graficaX + margenIzquierdo,
                graficaY + graficaHeight - margenInferior + 5,
                {
                    width: areaBarrasWidth,
                    align: 'center'
                }
            );

        // ============ LEYENDA A LA DERECHA (COMPACTA) ============
        const leyendaX = graficaX + graficaWidth + 8;
        let leyendaY = graficaY + 5;

        const leyendas = [
            { codigo: 'DA', texto: 'Domina los aprendizajes', color: '#4A90E2' },
            { codigo: 'AA', texto: 'Alcanza los aprendizajes', color: '#F5A623' },
            { codigo: 'PA', texto: 'Está próximo a alcanzar', color: '#808080' },
            { codigo: 'NA', texto: 'No alcanza los aprendizajes', color: '#D4A574' }
        ];

        leyendas.forEach((leyenda) => {
            // Cuadrado de color
            const cuadradoSize = 5;
            doc.rect(leyendaX, leyendaY, cuadradoSize, cuadradoSize)
                .fillOpacity(1)
                .fill(leyenda.color)
                .stroke('#000');

            // ✅ Texto más pequeño (4.5pt) para que quepa
            doc.fontSize(4.5).font('Helvetica').fillColor('#000')
                .text(
                    `${leyenda.texto} (${leyenda.codigo})`,
                    leyendaX + cuadradoSize + 2,
                    leyendaY,
                    {
                        width: leyendaWidth - cuadradoSize - 2,
                        lineBreak: true,
                        continued: false
                    }
                );

            leyendaY += 12; // ✅ Espacio reducido entre items
        });

        // Resetear opacidad y color
        doc.fillOpacity(1).fillColor('#000');
    }

    /**
 * FASE 6: Dibuja la firma del docente
 */
    private dibujarFirmaDocente(doc: PDFKit.PDFDocument, datos: DatosReporteMateria) {
        const pageWidth = doc.page.width;
        let currentY = doc.y + 25; // Espacio desde la sección anterior

        // ============ LÍNEA DE FIRMA (CENTRADA) ============
        const lineaWidth = 200; // Ancho de la línea de firma
        const lineaX = (pageWidth - lineaWidth) / 2; // Centrar horizontalmente

        doc.moveTo(lineaX, currentY)
            .lineTo(lineaX + lineaWidth, currentY)
            .stroke('#000');

        currentY += 3; // Espacio entre línea y texto

        // ============ NOMBRE DEL DOCENTE (CENTRADO) ============
        const docenteNombre = datos.docente
            ? `${datos.docente.apellidos} ${datos.docente.nombres}`.toUpperCase()
            : 'SIN ASIGNAR';

        doc.fontSize(6).font('Helvetica-Bold').fillColor('#000')
            .text(
                docenteNombre,
                lineaX,
                currentY,
                {
                    width: lineaWidth,
                    align: 'center'
                }
            );

        currentY += 10; // Espacio entre nombre y rol

        // ============ ROL "DOCENTE" (CENTRADO) ============
        doc.fontSize(6).font('Helvetica').fillColor('#000')
            .text(
                'DOCENTE',
                lineaX,
                currentY,
                {
                    width: lineaWidth,
                    align: 'center'
                }
            );

        // Actualizar posición Y
        doc.y = currentY + 10;

        // Resetear color
        doc.fillColor('#000');
    }


    // ==================== UTILIDADES ====================

    private formatearNota(nota: number | null | undefined): string {
        if (nota === null || nota === undefined) return '-';
        return nota.toFixed(2);
    }

    private obtenerCualitativa(nota: number): string {
        if (nota >= 9.0) return 'DA';
        if (nota >= 7.0) return 'AA';
        if (nota >= 4.01) return 'PA';
        return 'NA';
    }
    // ==================== CONCENTRADO DE CALIFICACIONES ====================
    private dibujarEncabezadoConcentrado(doc: PDFKit.PDFDocument, datos: DatosConcentradoCalificaciones) {
        const pageWidth = doc.page.width;
        const marginLeft = 20;
        const marginRight = 20;
        const encabezadoWidth = pageWidth - marginLeft - marginRight;
        let currentY = 20;

        // ============ PRIMERA SECCIÓN: TÍTULO INSTITUCIONAL ============
        const tituloHeight = 45;

        doc
            .rect(marginLeft, currentY, encabezadoWidth, tituloHeight)
            .lineWidth(1)
            .stroke('#000');

        // Logo (si existe)
        const logoPath = 'public/assets/logo.jpg';
        try {
            doc.image(logoPath, marginLeft + 5, currentY + 5, { width: 35, height: 35 });
        } catch (error) {
            // Logo no disponible
        }

        // Título principal
        doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text(
                'UNIDAD EDUCATIVA FISCAL CINCO DE JUNIO',
                marginLeft,
                currentY + 8,
                { width: encabezadoWidth, align: 'center' }
            );

        // Subtítulo
        doc
            .fontSize(9)
            .font('Helvetica')
            .text(
                'CONCENTRADO DE CALIFICACIONES',
                marginLeft,
                currentY + 23,
                { width: encabezadoWidth, align: 'center' }
            );

        currentY += tituloHeight + 2;

        // ============ SEGUNDA SECCIÓN: INFORMACIÓN DEL CURSO Y TRIMESTRE ============
        const infoHeight = 60;

        doc
            .rect(marginLeft, currentY, encabezadoWidth, infoHeight)
            .lineWidth(1)
            .stroke('#000');

        const colWidth = encabezadoWidth / 3;
        let startX = marginLeft;

        // Columna 1: Período Lectivo y Trimestre
        doc
            .fontSize(7)
            .font('Helvetica-Bold')
            .text('PERÍODO LECTIVO:', startX + 5, currentY + 5);
        doc
            .font('Helvetica')
            .text(datos.periodo.nombre, startX + 5, currentY + 14, { width: colWidth - 10 });

        doc
            .font('Helvetica-Bold')
            .text('TRIMESTRE:', startX + 5, currentY + 26);
        doc
            .font('Helvetica')
            .text(datos.trimestre.nombre, startX + 5, currentY + 35, { width: colWidth - 10 });

        // Línea divisoria 1
        doc
            .moveTo(startX + colWidth, currentY)
            .lineTo(startX + colWidth, currentY + infoHeight)
            .stroke();

        startX += colWidth;

        // Columna 2: Curso
        doc
            .font('Helvetica-Bold')
            .text('CURSO:', startX + 5, currentY + 5);

        const cursoTexto = `${datos.curso.nivel} "${datos.curso.paralelo}"`;
        doc
            .font('Helvetica')
            .text(cursoTexto, startX + 5, currentY + 14, { width: colWidth - 10 });

        doc
            .font('Helvetica-Bold')
            .text('ESPECIALIDAD:', startX + 5, currentY + 26);
        doc
            .font('Helvetica')
            .text(datos.curso.especialidad, startX + 5, currentY + 35, { width: colWidth - 10 });

        // Línea divisoria 2
        doc
            .moveTo(startX + colWidth, currentY)
            .lineTo(startX + colWidth, currentY + infoHeight)
            .stroke();

        startX += colWidth;

        // Columna 3: Tutor
        doc
            .font('Helvetica-Bold')
            .text('TUTOR/A:', startX + 5, currentY + 5);

        const tutorNombre = `${datos.docente.nombres} ${datos.docente.apellidos}`;
        doc
            .font('Helvetica')
            .text(tutorNombre, startX + 5, currentY + 14, { width: colWidth - 10 });

        doc
            .font('Helvetica-Bold')
            .text('TOTAL ESTUDIANTES:', startX + 5, currentY + 26);
        doc
            .font('Helvetica')
            .text(datos.estudiantes.length.toString(), startX + 5, currentY + 35);
    }

    private dibujarTablaConcentrado(doc: PDFKit.PDFDocument, datos: DatosConcentradoCalificaciones) {
        // 1. Configuraciones iniciales
        const { width: pageWidth, height: pageHeight } = doc.page;
        const marginLeft = 20, marginRight = 20, marginBottom = 80;
        let currentY = 130;
        const tableWidth = pageWidth - marginLeft - marginRight;

        // 2. Cálculo dinámico de anchos basado en DATOS REALES
        const numMaterias = datos.materias_orden.length;
        const rankingWidth = 30, nombreWidth = 150, promedioWidth = 40, cualitativaWidth = 35;

        // Si no hay materias, evitamos división por cero
        const materiaWidth = numMaterias > 0
            ? (tableWidth - rankingWidth - nombreWidth - promedioWidth - cualitativaWidth) / numMaterias
            : 0;

        // 3. Función auxiliar para celdas (Mantiene consistencia de estilo)
        const drawCell = (x: number, y: number, w: number, h: number, text: string, bgColor: string, isBold = false, align: 'center' | 'left' = 'center') => {
            doc.rect(x, y, w, h).fillAndStroke(bgColor, '#333');
            doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(7)
                .fillColor('#000')
                .text(text || '', x + 2, y + (h / 2) - 3, { width: w - 4, align: align });
        };

        // 4. Función para redibujar encabezados (Se llama al inicio y en cada addPage)
        const imprimirEncabezados = (y: number) => {
            const hHeight = 60;
            let xP = marginLeft;

            drawCell(xP, y, rankingWidth, hHeight, 'RANK', '#F2F2F2', true);
            xP += rankingWidth;
            drawCell(xP, y, nombreWidth, hHeight, 'APELLIDOS Y NOMBRES', '#F2F2F2', true);
            xP += nombreWidth;

            datos.materias_orden.forEach((materia, index) => {
                const color = index % 2 === 0 ? '#E8F4FD' : '#FEF9E7';
                doc.rect(xP, y, materiaWidth, hHeight).fillAndStroke(color, '#333');
                // Usamos tu método existente para rotar el nombre de la materia
                this.dibujarTextoRotado(doc, materia.toUpperCase(), xP, y, materiaWidth, hHeight);
                xP += materiaWidth;
            });

            drawCell(xP, y, promedioWidth, hHeight, 'PROM', '#F2F2F2', true);
            xP += promedioWidth;
            drawCell(xP, y, cualitativaWidth, hHeight, 'CUAL', '#F2F2F2', true);

            return y + hHeight;
        };

        // ============ RENDERIZADO INICIAL ============
        currentY = imprimirEncabezados(currentY);

        // ============ FILAS DE ESTUDIANTES (DATOS REALES) ============
        const rowHeight = 18;

        datos.estudiantes.forEach((estudiante, index) => {
            // Control de salto de página
            if (currentY + rowHeight > pageHeight - marginBottom) {
                doc.addPage({ size: 'LEGAL', layout: 'landscape', margins: { top: 20, bottom: 20, left: 20, right: 20 } });
                currentY = 40;
                currentY = imprimirEncabezados(currentY);
            }

            const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9F9F9';
            let xPos = marginLeft;

            // Ranking y Nombre
            drawCell(xPos, currentY, rankingWidth, rowHeight, estudiante.ranking.toString(), rowBg);
            xPos += rankingWidth;
            drawCell(xPos, currentY, nombreWidth, rowHeight, estudiante.nombres_completos, rowBg, false, 'left');
            xPos += nombreWidth;

            // Notas por Materia (Siguiendo el orden de materias_orden)
            datos.materias_orden.forEach((materiaNombre, idx) => {
                const cellColor = idx % 2 === 0 ? '#F4FAFF' : '#FFFDF5';

                // Buscamos la calificación que coincida con el nombre de la materia
                const calif = estudiante.calificaciones_materias.find(c => c.materia_nombre === materiaNombre);
                const notaTexto = calif && calif.nota_final > 0 ? calif.nota_final.toFixed(2) : '-';

                drawCell(xPos, currentY, materiaWidth, rowHeight, notaTexto, cellColor);
                xPos += materiaWidth;
            });

            // Totales del Estudiante
            drawCell(xPos, currentY, promedioWidth, rowHeight, estudiante.promedio_general.toFixed(2), rowBg, true);
            xPos += promedioWidth;
            drawCell(xPos, currentY, cualitativaWidth, rowHeight, estudiante.cualitativa_general, rowBg);

            currentY += rowHeight;
        });

        // ============ FILA DE PROMEDIOS DEL CURSO ============
        // Verificamos si hay espacio para el pie de tabla
        if (currentY + rowHeight > pageHeight - marginBottom) {
            doc.addPage({ size: 'LEGAL', layout: 'landscape' });
            currentY = 40;
            currentY = imprimirEncabezados(currentY);
        }

        let xFinal = marginLeft;
        const footerColor = '#D5F5E3';

        // Celda de etiqueta "PROMEDIOS"
        drawCell(xFinal, currentY, rankingWidth + nombreWidth, rowHeight, 'PROMEDIOS GENERALES', footerColor, true, 'left');
        xFinal += (rankingWidth + nombreWidth);

        // Promedios por materia
        datos.materias_orden.forEach((materiaNombre) => {
            const promMateria = datos.promedios_curso.find(p => p.materia_nombre === materiaNombre);
            const promTexto = promMateria && promMateria.promedio_materia > 0 ? promMateria.promedio_materia.toFixed(2) : '-';

            drawCell(xFinal, currentY, materiaWidth, rowHeight, promTexto, footerColor, true);
            xFinal += materiaWidth;
        });

        // Promedio y Cualitativa Final del Curso
        drawCell(xFinal, currentY, promedioWidth, rowHeight, datos.promedio_general_curso.toFixed(2), footerColor, true);
        xFinal += promedioWidth;
        drawCell(xFinal, currentY, cualitativaWidth, rowHeight, datos.cualitativa_general_curso, footerColor, true);
    }

    private dibujarFirmaConcentrado(doc: PDFKit.PDFDocument, datos: DatosConcentradoCalificaciones) {
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;
        const marginLeft = 20;

        const firmaY = pageHeight - 60;

        const tutorNombre = `${datos.docente.nombres} ${datos.docente.apellidos}`;

        doc
            .fontSize(8)
            .font('Helvetica')
            .text('_______________________________', marginLeft + 100, firmaY, { width: 200, align: 'center' });

        doc
            .fontSize(7)
            .font('Helvetica-Bold')
            .text(tutorNombre.toUpperCase(), marginLeft + 100, firmaY + 12, { width: 200, align: 'center' });

        doc
            .fontSize(7)
            .font('Helvetica')
            .text('Tutor/a del Curso', marginLeft + 100, firmaY + 22, { width: 200, align: 'center' });
    }

    // ========================= METODOS PARA REPORTE DE INSUMOS =============================================

    private dibujarEncabezadoReporteInsumos(doc: PDFKit.PDFDocument, datos: DatosReporteInsumos) {
        const pageWidth = doc.page.width;
        const marginLeft = 30;
        const marginRight = 30;
        const encabezadoWidth = pageWidth - marginLeft - marginRight;
        let currentY = 30;

        // Nombre de la institución
        doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text(
                'UNIDAD EDUCATIVA FISCAL CINCO DE JUNIO',
                marginLeft,
                currentY,
                { width: encabezadoWidth, align: 'center' }
            );

        currentY += 18;

        // Título del reporte
        doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(
                `APORTES DEL ${datos.trimestre.nombre.toUpperCase()}`,
                marginLeft,
                currentY,
                { width: encabezadoWidth, align: 'center' }
            );

        currentY += 15;

        // Período
        doc
            .fontSize(9)
            .font('Helvetica')
            .text(
                datos.periodo.nombre,
                marginLeft,
                currentY,
                { width: encabezadoWidth, align: 'center' }
            );

        currentY += 20;

        // Asignatura
        const asignaturaTexto = `ASIGNATURA:     ${datos.materia.nombre.toUpperCase()}`;
        doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .text(
                asignaturaTexto,
                marginLeft,
                currentY,
                { width: encabezadoWidth, align: 'center' }
            );

        currentY += 15;

        // Curso y Docente
        const cursoTexto = `${datos.curso.nivel} "${datos.curso.paralelo}"`;
        const docenteNombre = datos.docente
            ? `${datos.docente.apellidos} ${datos.docente.nombres}`.toUpperCase()
            : 'SIN ASIGNAR';

        const lineaCompleta = `CURSO:  ${cursoTexto}                    DOCENTE:  ${docenteNombre}`;

        doc
            .fontSize(9)
            .font('Helvetica')
            .text(
                lineaCompleta,
                marginLeft,
                currentY,
                { width: encabezadoWidth, align: 'center' }
            );

        currentY += 25;

        doc.y = currentY;
        doc.fillColor('#000');
    }
    private dibujarTablaInsumos(doc: PDFKit.PDFDocument, datos: DatosReporteInsumos) {
        const pageWidth = doc.page.width;
        const marginLeft = 30;
        const marginRight = 30;
        const marginBottom = 80; // Espacio para firmas/gráficos abajo
        let currentY = doc.y;

        const numInsumos = datos.insumos_orden.length;
        const numeroWidth = 25;
        const nombreWidth = 180;
        const promedioWidth = 45;
        const cualitativaWidth = 40;

        const insumosDisponibleWidth = pageWidth - marginLeft - marginRight - numeroWidth - nombreWidth - promedioWidth - cualitativaWidth;
        const insumoWidth = insumosDisponibleWidth / numInsumos;
        const tableWidth = numeroWidth + nombreWidth + (insumoWidth * numInsumos) + promedioWidth + cualitativaWidth;
        const startX = (pageWidth - tableWidth) / 2;

        const headerHeight = 60;
        const rowHeight = 16;

        // --- FUNCIÓN AUXILIAR DE CELDA (LA CLAVE DEL ÉXITO) ---
        const drawInsumoCell = (x: number, y: number, w: number, h: number, text: string, bgColor: string, isBold = false, align: 'center' | 'left' = 'center') => {
            doc.rect(x, y, w, h).fillAndStroke(bgColor, '#333'); // Borde gris oscuro suave
            doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(7)
                .fillColor('#000') // <--- Forzamos negro en cada celda
                .text(text || '', x + 2, y + (h / 2) - 3, { width: w - 4, align: align });
        };

        // --- FUNCIÓN PARA ENCABEZADOS (Para saltos de página) ---
        const imprimirEncabezadosInsumos = (y: number) => {
            let xP = startX;
            // Encabezados estáticos
            drawInsumoCell(xP, y, numeroWidth, headerHeight, 'N°', '#E0E0E0', true);
            xP += numeroWidth;
            drawInsumoCell(xP, y, nombreWidth, headerHeight, 'NÓMINA', '#E0E0E0', true);
            xP += nombreWidth;

            // Insumos rotados
            datos.insumos_orden.forEach((insumo, index) => {
                const color = index % 2 === 0 ? '#D6EAF8' : '#FCF3CF';
                doc.rect(xP, y, insumoWidth, headerHeight).fillAndStroke(color, '#333');
                this.dibujarTextoRotado(doc, insumo.toUpperCase(), xP, y, insumoWidth, headerHeight);
                xP += insumoWidth;
            });

            // Promedio y Cualitativa
            drawInsumoCell(xP, y, promedioWidth, headerHeight, 'PROM', '#E0E0E0', true);
            xP += promedioWidth;
            drawInsumoCell(xP, y, cualitativaWidth, headerHeight, 'CUAL', '#E0E0E0', true);

            return y + headerHeight;
        };

        // ============ RENDERIZADO DE TABLA ============
        currentY = imprimirEncabezadosInsumos(currentY);

        datos.estudiantes.forEach((estudiante, index) => {
            // Control de Salto de Página
            if (currentY + rowHeight > doc.page.height - marginBottom) {
                doc.addPage({ size: 'A4', layout: 'portrait', margins: { top: 30, bottom: 30, left: 30, right: 30 } });
                currentY = 50;
                currentY = imprimirEncabezadosInsumos(currentY);
            }

            let xPos = startX;
            const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F9F9F9';

            // N° y Nombre
            drawInsumoCell(xPos, currentY, numeroWidth, rowHeight, estudiante.numero.toString(), rowBg);
            xPos += numeroWidth;
            drawInsumoCell(xPos, currentY, nombreWidth, rowHeight, estudiante.estudiante_nombre, rowBg, false, 'left');
            xPos += nombreWidth;

            // Notas Insumos
            estudiante.calificaciones_insumos.forEach((cal, idx) => {
                const cellColor = idx % 2 === 0 ? '#EBF5FB' : '#FEF9E7';
                const notaTexto = cal.nota !== null ? cal.nota.toFixed(2) : '-';
                drawInsumoCell(xPos, currentY, insumoWidth, rowHeight, notaTexto, cellColor);
                xPos += insumoWidth;
            });

            // Promedio y Cualitativa del Estudiante
            drawInsumoCell(xPos, currentY, promedioWidth, rowHeight, estudiante.promedio_insumos.toFixed(2), rowBg, true);
            xPos += promedioWidth;
            drawInsumoCell(xPos, currentY, cualitativaWidth, rowHeight, estudiante.cualitativa, rowBg);

            currentY += rowHeight;
        });

        // ============ FILA DE PROMEDIOS FINALES ============
        if (currentY + rowHeight > doc.page.height - marginBottom) {
            doc.addPage();
            currentY = 50;
            currentY = imprimirEncabezadosInsumos(currentY);
        }

        let xFinal = startX;
        const footerColor = '#ABEBC6';

        // Etiqueta Promedios
        drawInsumoCell(xFinal, currentY, numeroWidth + nombreWidth, rowHeight, 'PROMEDIOS', footerColor, true, 'left');
        xFinal += (numeroWidth + nombreWidth);

        // Totales por cada Insumo
        datos.promedios_por_insumo.forEach((promedio, idx) => {
            const color = idx % 2 === 0 ? '#A9DFBF' : '#F9E79F';
            const promTexto = promedio > 0 ? promedio.toFixed(2) : '-';
            drawInsumoCell(xFinal, currentY, insumoWidth, rowHeight, promTexto, color, true);
            xFinal += insumoWidth;
        });

        // Final de Fila
        drawInsumoCell(xFinal, currentY, promedioWidth, rowHeight, datos.promedio_general_curso.toFixed(2), footerColor, true);
        xFinal += promedioWidth;
        drawInsumoCell(xFinal, currentY, cualitativaWidth, rowHeight, datos.cualitativa_general_curso, footerColor, true);

        currentY += rowHeight + 20;
        doc.y = currentY; // Actualizamos la posición global de PDFKit
    }

    private dibujarRendimientoYEscalaInsumos(doc: PDFKit.PDFDocument, datos: DatosReporteInsumos) {
        // Usar la misma lógica que dibujarRendimientoYEscala pero con datos de insumos
        this.dibujarRendimientoYEscala(doc, {
            ...datos,
            calificaciones: [] // No se usa en este contexto
        } as any);
    }

    private dibujarFirmaDocenteInsumos(doc: PDFKit.PDFDocument, datos: DatosReporteInsumos) {
        // Usar la misma lógica que dibujarFirmaDocente
        this.dibujarFirmaDocente(doc, datos as any);
    }

    // ========================= METODOS PARA REPORTE DE RENDIMIENTO ANUAL =============================================
    private dibujarEncabezadoRendimientoAnual(doc: PDFKit.PDFDocument, datos: DatosRendimientoAnual) {
        const pageWidth = doc.page.width;
        const marginLeft = 30;
        const marginRight = 30;
        const encabezadoWidth = pageWidth - marginLeft - marginRight;
        let currentY = 25; // Empezamos más arriba

        // Nombre de la institución
        doc.fontSize(10).font('Helvetica-Bold') // Bajó de 12 a 10
            .text('UNIDAD EDUCATIVA FISCAL CINCO DE JUNIO', marginLeft, currentY, { width: encabezadoWidth, align: 'center' });

        currentY += 12; // Espacio reducido

        // Título del reporte
        doc.fontSize(8.5).font('Helvetica-Bold') // Bajó de 10 a 8.5
            .text('INFORME RENDIMIENTO ACADÉMICO ANUAL', marginLeft, currentY, { width: encabezadoWidth, align: 'center' });

        currentY += 10;

        // Período
        doc.fontSize(8).font('Helvetica')
            .text(datos.periodo.nombre, marginLeft, currentY, { width: encabezadoWidth, align: 'center' });

        currentY += 12;

        // Asignatura
        const asignaturaTexto = `ASIGNATURA: ${datos.materia.nombre.toUpperCase()}`;
        doc.fontSize(8).font('Helvetica-Bold')
            .text(asignaturaTexto, marginLeft, currentY, { width: encabezadoWidth, align: 'center' });

        currentY += 10;

        // Curso y Docente
        const cursoTexto = `${datos.curso.nivel} "${datos.curso.paralelo}"`;
        const docenteNombre = datos.docente
            ? `${datos.docente.apellidos} ${datos.docente.nombres}`.toUpperCase()
            : 'SIN ASIGNAR';

        doc.fontSize(8).font('Helvetica')
            .text(`CURSO: ${cursoTexto}           DOCENTE: ${docenteNombre}`, marginLeft, currentY, { width: encabezadoWidth, align: 'center' });

        currentY += 15; // Espacio final antes de la tabla reducido de 25 a 15

        doc.y = currentY;
    }
    private dibujarTablaRendimientoAnual(doc: PDFKit.PDFDocument, datos: DatosRendimientoAnual) {
        const pageWidth = doc.page.width;
        const marginLeft = 20, marginBottom = 20;
        let currentY = 90; // Posición optimizada tras el encabezado compacto

        // 1. CONFIGURACIÓN DE ANCHOS
        const col = {
            n: 20,
            nomina: 150,
            trimestre: 50,
            promAnual: 30,
            cualAnual: 28,
            equivalencia: 40,
            supletorio: 35,
            equiFinal: 40
        };

        const tableWidth = col.n + col.nomina + (col.trimestre * 3) + col.promAnual +
            col.cualAnual + col.equivalencia + col.supletorio + col.equiFinal;
        const startX = (pageWidth - tableWidth) / 2;

        const headerHeight = 70;
        const subH = 12;

        const drawCell = (x: number, y: number, w: number, h: number, text: string, bgColor: string, isBold = false, align: 'center' | 'left' = 'center', fontSize = 5.5, textColor = '#000') => {
            doc.rect(x, y, w, h).fillAndStroke(bgColor, '#333');
            const textY = y + (h / 2) - (fontSize / 2);
            doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize).fillColor(textColor)
                .text(text || '', x + 2, textY, { width: w - 4, align: align, lineBreak: false });
        };

        const imprimirEncabezados = (y: number) => {
            let xP = startX;
            drawCell(xP, y, col.n, headerHeight, 'N°', '#E0E0E0', true); xP += col.n;
            drawCell(xP, y, col.nomina, headerHeight, 'APELLIDOS Y NOMBRES', '#E0E0E0', true); xP += col.nomina;

            const totalTrimWidth = col.trimestre * 3;
            drawCell(xP, y, totalTrimWidth, subH, 'PONDERADO ANUAL', '#D6EAF8', true);

            let xSub = xP;
            ['1° TRIM', '2° TRIM', '3° TRIM'].forEach(trim => {
                drawCell(xSub, y + subH, col.trimestre, subH, trim, '#EBF5FB', true);
                drawCell(xSub, y + (subH * 2), col.trimestre / 2, headerHeight - (subH * 2), 'N', '#EBF5FB', true, 'center', 5);
                drawCell(xSub + (col.trimestre / 2), y + (subH * 2), col.trimestre / 2, headerHeight - (subH * 2), 'C', '#EBF5FB', true, 'center', 5);
                xSub += col.trimestre;
            });
            xP += totalTrimWidth;

            const rotadas = [
                { w: col.promAnual, t: 'NOTA FINAL', bg: '#FCF3CF' },
                { w: col.cualAnual, t: 'CUALIT.', bg: '#F2F2F2' },
                { w: col.equivalencia, t: 'EQUIV.', bg: '#FEF9E7' },
                { w: col.supletorio, t: 'SUPLE.', bg: '#F2F2F2' },
                { w: col.equiFinal, t: 'EQUIV. FINAL', bg: '#D5F5E3' }
            ];

            rotadas.forEach(r => {
                doc.rect(xP, y, r.w, headerHeight).fillAndStroke(r.bg, '#333');
                this.dibujarTextoRotado(doc, r.t, xP, y, r.w, headerHeight);
                xP += r.w;
            });
            return y + headerHeight;
        };

        // 2. IMPRESIÓN DE DATOS REALES
        currentY = imprimirEncabezados(currentY);
        const rowH = 10;

        // Volvemos a la lógica real de la base de datos
        datos.estudiantes.forEach((est, index) => {
            // Control de salto de página por si acaso el curso es extremadamente grande (+50 alumnos)
            if (currentY + rowH > doc.page.height - 150) { // Margen para asegurar que entren cuadros abajo
                doc.addPage();
                currentY = 50;
                currentY = imprimirEncabezados(currentY);
            }

            let xP = startX;
            const bg = index % 2 === 0 ? '#FFFFFF' : '#F9F9F9';

            // N° basado en el índice real de la base de datos
            drawCell(xP, currentY, col.n, rowH, (index + 1).toString(), bg); xP += col.n;
            drawCell(xP, currentY, col.nomina, rowH, est.estudiante_nombre, bg, false, 'left', 5.5); xP += col.nomina;

            const trims = [
                { n: est.trimestre_1, c: est.cualitativa_1 },
                { n: est.trimestre_2, c: est.cualitativa_2 },
                { n: est.trimestre_3, c: est.cualitativa_3 }
            ];

            trims.forEach(t => {
                const colorNota = t.n < 7 ? '#E74C3C' : '#000';
                drawCell(xP, currentY, col.trimestre / 2, rowH, t.n.toFixed(2), bg, false, 'center', 5.5, colorNota);
                drawCell(xP + (col.trimestre / 2), currentY, col.trimestre / 2, rowH, t.c, bg);
                xP += col.trimestre;
            });

            const colorPromAnual = est.promedio_anual < 7 ? '#E74C3C' : '#000';
            drawCell(xP, currentY, col.promAnual, rowH, est.promedio_anual.toFixed(2), '#FEF9E7', true, 'center', 5.5, colorPromAnual);
            xP += col.promAnual;

            drawCell(xP, currentY, col.cualAnual, rowH, est.cualitativa_anual, bg); xP += col.cualAnual;

            const bgEqui = est.estado_antes_supletorio === 'SUPLETORIO' ? '#FADBD8' : bg;
            drawCell(xP, currentY, col.equivalencia, rowH, est.estado_antes_supletorio, bgEqui, false, 'center', 4.5); xP += col.equivalencia;

            const notaFinalTxt = est.promedio_final ? est.promedio_final.toFixed(2) : '-';
            const colorFinalNota = (est.promedio_final && est.promedio_final < 7) ? '#E74C3C' : '#000';
            drawCell(xP, currentY, col.supletorio, rowH, notaFinalTxt, bg, false, 'center', 5.5, colorFinalNota); xP += col.supletorio;

            const bgFinal = est.estado_final === 'APROBADO' ? '#D5F5E3' : '#FADBD8';
            drawCell(xP, currentY, col.equiFinal, rowH, est.estado_final, bgFinal, true, 'center', 4.5);

            currentY += rowH;
        });

        // --- FILA DE PROMEDIOS ---
        let xF = startX;
        const footerBg = '#ABEBC6';
        drawCell(xF, currentY, col.n + col.nomina, rowH, 'PROMEDIOS', footerBg, true, 'center');
        xF += (col.n + col.nomina);

        const pGlob = datos.promedios_globales;
        [pGlob.trimestre_1, pGlob.trimestre_2, pGlob.trimestre_3].forEach(p => {
            drawCell(xF, currentY, col.trimestre / 2, rowH, p.toFixed(2), footerBg, true);
            drawCell(xF + (col.trimestre / 2), currentY, col.trimestre / 2, rowH, '', footerBg);
            xF += col.trimestre;
        });

        drawCell(xF, currentY, col.promAnual, rowH, pGlob.promedio_anual.toFixed(2), footerBg, true);
        xF += col.promAnual;
        drawCell(xF, currentY, col.cualAnual + col.equivalencia + col.supletorio + col.equiFinal, rowH, '', footerBg);

        doc.y = currentY + rowH + 5;
    }

    private dibujarCuadrosEstadisticosAnuales(doc: PDFKit.PDFDocument, datos: DatosRendimientoAnual) {
        const startY = doc.y + 2; // Pegamos más al bloque anterior
        const marginLeft = 35;
        const rowH = 11; // Reducido de 14 a 11 (Ajuste clave)
        const totalEst = datos.estudiantes.length;

        // Helper para celdas con estilo
        const drawCell = (x: number, y: number, w: number, text: string, opts: { bold?: boolean, bg?: string, align?: any } = {}) => {
            if (opts.bg) {
                doc.rect(x, y, w, rowH).fillAndStroke(opts.bg, '#000');
            } else {
                doc.rect(x, y, w, rowH).stroke('#000');
            }
            doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(5.5)
                .fillColor('#000')
                // Ajustamos el y + 3 para que el texto quede centrado verticalmente en la celda de 11
                .text(text, x + 3, y + 3, { width: w - 6, align: opts.align || 'center', lineBreak: false });
        };

        // ================================================================
        // TABLA IZQUIERDA: INFORME RENDIMIENTO
        // ================================================================
        let xI = marginLeft;
        let yI = startY;
        const colDescW = 150;
        const colCantW = 25;
        const colPctW = 35;
        const totalTableIW = colDescW + colCantW + colPctW;

        drawCell(xI, yI, colDescW, 'INFORME RENDIMIENTO ACADÉMICO ANUAL', { bold: true, bg: '#F2F2F2', align: 'left' });
        drawCell(xI + colDescW, yI, colCantW, 'C', { bold: true, bg: '#F2F2F2' });
        drawCell(xI + colDescW + colCantW, yI, colPctW, '%', { bold: true, bg: '#F2F2F2' });
        yI += rowH;

        const filasI = [
            { d: 'Domina los aprendizajes (DA)', v: datos.estadisticas_rendimiento.da },
            { d: 'Alcanza los aprendizajes (AA)', v: datos.estadisticas_rendimiento.aa },
            { d: 'Está próximo a alcanzar (PA)', v: datos.estadisticas_rendimiento.pa },
            { d: 'No alcanza los aprendizajes (NA)', v: datos.estadisticas_rendimiento.na }
        ];

        filasI.forEach(f => {
            const pct = totalEst > 0 ? ((f.v / totalEst) * 100).toFixed(2) + '%' : '0.00%';
            drawCell(xI, yI, colDescW, f.d, { align: 'left' });
            drawCell(xI + colDescW, yI, colCantW, f.v.toString());
            drawCell(xI + colDescW + colCantW, yI, colPctW, pct);
            yI += rowH;
        });

        drawCell(xI, yI, colDescW, 'TOTAL', { bold: true, bg: '#F2F2F2', align: 'right' });
        drawCell(xI + colDescW, yI, colCantW, totalEst.toString(), { bold: true });
        drawCell(xI + colDescW + colCantW, yI, colPctW, '100.00%', { bold: true });

        // ================================================================
        // TABLA DERECHA: RESUMEN ANUAL
        // ================================================================
        let xD = xI + totalTableIW + 15;
        let yD = startY;

        const wSeccionT = 95;
        const wSeccionS = 95;
        const wC = 25;
        const wP = 35;
        const totalTableDW = wSeccionT + wC + wP + wSeccionS + wC + wP;

        drawCell(xD, yD, totalTableDW, 'RESUMEN ANUAL (APROBADOS)', { bold: true, bg: '#F2F2F2' });
        yD += rowH;

        drawCell(xD, yD, wSeccionT, 'TRIMESTRALES', { bold: true, bg: '#D6EAF8', align: 'left' });
        drawCell(xD + wSeccionT, yD, wC, 'C', { bold: true, bg: '#D6EAF8' });
        drawCell(xD + wSeccionT + wC, yD, wP, '%', { bold: true, bg: '#D6EAF8' });

        drawCell(xD + wSeccionT + wC + wP, yD, wSeccionS, 'EXAMEN SUPLETORIO', { bold: true, bg: '#D5F5E3', align: 'left' });
        drawCell(xD + wSeccionT + wC + wP + wSeccionS, yD, wC, 'C', { bold: true, bg: '#D5F5E3' });
        drawCell(xD + wSeccionT + wC + wP + wSeccionS + wC, yD, wP, '%', { bold: true, bg: '#D5F5E3' });
        yD += rowH;

        const res = datos.resumen_anual;
        const totalSupl = res.supletorio_aprobados + res.supletorio_reprobados;

        const filasD = [
            {
                t_nom: 'APROBADOS', t_c: res.trimestral_aprobados, t_p: totalEst > 0 ? (res.trimestral_aprobados / totalEst * 100).toFixed(2) : '0',
                s_nom: 'APROBADOS', s_c: res.supletorio_aprobados, s_p: totalSupl > 0 ? (res.supletorio_aprobados / totalSupl * 100).toFixed(2) : '0'
            },
            {
                t_nom: 'SUPLETORIOS', t_c: res.trimestral_supletorios, t_p: totalEst > 0 ? (res.trimestral_supletorios / totalEst * 100).toFixed(2) : '0',
                s_nom: 'REPROBADOS', s_c: res.supletorio_reprobados, s_p: totalSupl > 0 ? (res.supletorio_reprobados / totalSupl * 100).toFixed(2) : '0'
            },
            {
                t_nom: 'REPROBADOS', t_c: res.trimestral_reprobados, t_p: totalEst > 0 ? (res.trimestral_reprobados / totalEst * 100).toFixed(2) : '0',
                s_nom: 'NO ASISTIÓ', s_c: 0, s_p: '0.00'
            }
        ];

        filasD.forEach(f => {
            drawCell(xD, yD, wSeccionT, f.t_nom, { align: 'left' });
            drawCell(xD + wSeccionT, yD, wC, f.t_c.toString());
            drawCell(xD + wSeccionT + wC, yD, wP, f.t_p + '%');

            drawCell(xD + wSeccionT + wC + wP, yD, wSeccionS, f.s_nom, { align: 'left' });
            drawCell(xD + wSeccionT + wC + wP + wSeccionS, yD, wC, f.s_c.toString());
            drawCell(xD + wSeccionT + wC + wP + wSeccionS + wC, yD, wP, f.s_p + '%');
            yD += rowH;
        });

        drawCell(xD, yD, wSeccionT, 'TOTAL', { bold: true, bg: '#F2F2F2', align: 'right' });
        drawCell(xD + wSeccionT, yD, wC, totalEst.toString(), { bold: true });
        drawCell(xD + wSeccionT + wC, yD, wP, '100%', { bold: true });

        drawCell(xD + wSeccionT + wC + wP, yD, wSeccionS, 'TOTAL SUPL.', { bold: true, bg: '#F2F2F2', align: 'right' });
        drawCell(xD + wSeccionT + wC + wP + wSeccionS, yD, wC, totalSupl.toString(), { bold: true });
        drawCell(xD + wSeccionT + wC + wP + wSeccionS + wC, yD, wP, '100%', { bold: true });

        // Al final, dejamos solo 10 puntos de margen para que el siguiente bloque (gráfica) suba
        doc.y = yD + 10;
    }

    // ====================================RESUMEN FINAL=========================================================
    private dibujarResumenFinal(doc: PDFKit.PDFDocument, datos: DatosRendimientoAnual) {
        const res = datos.resumen_final;
        const startY = doc.y + 5;
        const marginLeft = 40;
        const pageWidth = 520;

        // 1. FRANJA NARANJA
        doc.rect(marginLeft, startY, pageWidth, 10)
            .fillAndStroke('#E67E22', '#E67E22');
        doc.fillColor('#FFF').font('Helvetica-Bold').fontSize(5.5)
            .text('RESUMEN FINAL', marginLeft, startY + 2, { width: pageWidth, align: 'center' });

        const tableY = startY + 15;

        // 2. GRÁFICA CON ESPACIO SUPERIOR (Margen para el 100%)
        const graphX = marginLeft + 10;
        const graphW = 160;
        const graphH = 60; // Aumentamos un poco la caja contenedora

        doc.lineWidth(0.5).rect(graphX, tableY, graphW, graphH).stroke('#BDC3C7');

        const barW = 25;
        // maxBarH de 30 sobre un graphH de 60 nos deja 30 puntos de "techo" libre
        const maxBarH = 30;
        const baseY = tableY + graphH - 15;

        // --- Barra Aprobados ---
        const hApro = (res.aprobados / res.total_asistentes) * maxBarH;
        doc.rect(graphX + 30, baseY - hApro, barW, hApro).fill('#2E86C1');

        // Etiqueta de porcentaje (Ahora con espacio de sobra arriba)
        doc.fillColor('#000').fontSize(5.5).font('Helvetica-Bold')
            .text(`${res.porcentaje_aprobados}%`, graphX + 30, baseY - hApro - 9, { width: barW, align: 'center' });

        doc.fontSize(5.5).text('APROBADOS', graphX + 20, baseY + 3, { width: 45, align: 'center' });

        // --- Barra Reprobados ---
        const hRepro = (res.reprobados / res.total_asistentes) * maxBarH;
        doc.rect(graphX + 90, baseY - hRepro, barW, hRepro).fill('#CB4335');

        doc.fillColor('#000').fontSize(5.5).font('Helvetica-Bold')
            .text(`${res.porcentaje_reprobados}%`, graphX + 90, baseY - hRepro - 9, { width: barW, align: 'center' });

        doc.fontSize(5.5).text('REPROBADOS', graphX + 80, baseY + 3, { width: 45, align: 'center' });
        // 3. TABLA DE TOTALES (Misma lógica compacta)
        const tableX = graphX + graphW + 20;
        const colDescW = 160;
        const colValW = 40;
        const colPctW = 40;
        const rowH = 13;

        const drawResRow = (y: number, label: string, val: string, pct: string, color: string, isBold = false) => {
            doc.rect(tableX, y, colDescW, rowH).fillAndStroke(color, '#000');
            doc.fillColor('#000').font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(5.5)
                .text(label, tableX + 5, y + 3.5, { width: colDescW - 10, align: 'left' });

            doc.rect(tableX + colDescW, y, colValW, rowH).stroke('#000');
            doc.text(val, tableX + colDescW, y + 3.5, { width: colValW, align: 'center' });

            doc.rect(tableX + colDescW + colValW, y, colPctW, rowH).stroke('#000');
            doc.text(pct, tableX + colDescW + colValW, y + 3.5, { width: colPctW, align: 'center' });
        };

        drawResRow(tableY, 'ALUMNOS APROBADOS', res.aprobados.toString(), res.porcentaje_aprobados + '%', '#D6EAF8');
        drawResRow(tableY + rowH, 'ALUMNOS REPROBADOS', res.reprobados.toString(), res.porcentaje_reprobados + '%', '#FADBD8');
        drawResRow(tableY + (rowH * 2), 'TOTAL DE ESTUDIANTES ASISTENTE', res.total_asistentes.toString(), '100%', '#EBEDEF', true);

        doc.y = tableY + (rowH * 3) + 15;
    }
    private dibujarFirmaDocenteAnual(doc: PDFKit.PDFDocument, datos: DatosRendimientoAnual) {
        this.dibujarFirmaDocente(doc, datos as any);
    }
}