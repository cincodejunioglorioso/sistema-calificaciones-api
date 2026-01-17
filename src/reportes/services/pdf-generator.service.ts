// nest-backend/src/reportes/services/pdf-generator.service.ts
import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { DatosLibretaEstudiante } from '../interfaces/datos-libreta.interface';
import { DatosReporteMateria } from '../interfaces/datos-reporte-materia.interface';
import { CalificacionCualitativa } from '../../common/enums/cualitativa.enum';

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

        // ============ DEFINIR ANCHOS DE COLUMNAS (APROVECHANDO MÁS ESPACIO) ============
        const colWidths = {
            asignatura: 100,          // ✅ Aumentado
            trimestreCompleto: 200,  // ✅ Aumentado
            promedioFinal: 40,       // ✅ Aumentado
            cualitativa: 35          // ✅ Aumentado
        };

        // Sub-columnas dentro de cada trimestre (DEBEN SUMAR 190)
        const subColWidths = {
            aporte: 55,      // PROMEDIO (27.5) + 70% (27.5) = 55
            sumativa: 110,   // PROY.INT (27.5) + 15% (27.5) + PRUEBA (27.5) + 15% (27.5) = 110
            notaTrimestre: 35 // TOTAL + EQUIV
        };

        // Micro-columnas (DEBEN ENCAJAR PERFECTAMENTE)
        const microWidths = {
            // APORTE (55 total)
            promedio: 27,
            ponderado70: 28,

            // SUMATIVA (110 total)
            proyectoIntegrador: 27,
            ponderado15_1: 28,
            pruebaEstructurada: 27,
            ponderado15_2: 28,

            // NOTA TRIMESTRE (35 total)
            notaTotal: 18,
            equivalencia: 17
        };

        const finalTableWidth = colWidths.asignatura +
            (colWidths.trimestreCompleto * 3) +
            colWidths.promedioFinal +
            colWidths.cualitativa;

        const startX = marginLeft;
        const headerLevel2Height = 10;
        const headerLevel3Height = 50; // ✅ Altura óptima
        const headerHeight = 12 + headerLevel2Height + headerLevel3Height;

        // ============ DIBUJAR RECTÁNGULO DE "ASIGNATURA" (COMBINA 3 FILAS) ============
        doc
            .rect(startX, currentY, colWidths.asignatura, headerHeight)
            .lineWidth(1)
            .stroke('#000');

        doc
            .fontSize(7)
            .font('Helvetica-Bold')
            .text('Asignatura', startX + 2, currentY + (headerHeight / 2) - 3, {
                width: colWidths.asignatura - 4,
                align: 'center'
            });

        // ============ NIVEL 1: TRIMESTRES + PROMEDIO + CUALITATIVA ============
        let xPos = startX + colWidths.asignatura;

        // Primer Trimestre
        doc
            .rect(xPos, currentY, colWidths.trimestreCompleto, 12)
            .stroke('#000');
        doc
            .fontSize(6)
            .font('Helvetica-Bold')
            .text('PRIMER TRIMESTRE', xPos, currentY + 3, {
                width: colWidths.trimestreCompleto,
                align: 'center'
            });
        xPos += colWidths.trimestreCompleto;

        // Segundo Trimestre
        doc
            .rect(xPos, currentY, colWidths.trimestreCompleto, 12)
            .stroke('#000');
        doc.text('SEGUNDO TRIMESTRE', xPos, currentY + 3, {
            width: colWidths.trimestreCompleto,
            align: 'center'
        });
        xPos += colWidths.trimestreCompleto;

        // Tercer Trimestre
        doc
            .rect(xPos, currentY, colWidths.trimestreCompleto, 12)
            .stroke('#000');
        doc.text('TERCER TRIMESTRE', xPos, currentY + 3, {
            width: colWidths.trimestreCompleto,
            align: 'center'
        });
        xPos += colWidths.trimestreCompleto;

        // Promedio Final (combina 3 filas) - ROTADO
        doc
            .rect(xPos, currentY, colWidths.promedioFinal, headerHeight)
            .stroke('#000');
        this.dibujarTextoRotado(doc, 'PROMEDIO FINAL', xPos, currentY, colWidths.promedioFinal, headerHeight);
        xPos += colWidths.promedioFinal;

        // Cualitativa (combina 3 filas) - ROTADO
        doc
            .rect(xPos, currentY, colWidths.cualitativa, headerHeight)
            .stroke('#000');
        this.dibujarTextoRotado(doc, 'CUALITATIVA', xPos, currentY, colWidths.cualitativa, headerHeight);

        currentY += 12;

        // ============ NIVEL 2: APORTE | SUMATIVA | Nota Trimestre (x3) ============
        xPos = startX + colWidths.asignatura;

        for (let i = 0; i < 3; i++) {
            // APORTE
            doc
                .rect(xPos, currentY, subColWidths.aporte, headerLevel2Height)
                .stroke('#000');
            doc
                .fontSize(5)
                .font('Helvetica-Bold')
                .text('APORTE', xPos, currentY + 2, {
                    width: subColWidths.aporte,
                    align: 'center'
                });
            xPos += subColWidths.aporte;

            // SUMATIVA
            doc
                .rect(xPos, currentY, subColWidths.sumativa, headerLevel2Height)
                .stroke('#000');
            doc.text('SUMATIVA', xPos, currentY + 2, {
                width: subColWidths.sumativa,
                align: 'center'
            });
            xPos += subColWidths.sumativa;

            // Nota Trimestre
            doc
                .rect(xPos, currentY, subColWidths.notaTrimestre, headerLevel2Height)
                .stroke('#000');
            doc.text('Nota Trim.', xPos, currentY + 2, {
                width: subColWidths.notaTrimestre,
                align: 'center'
            });
            xPos += subColWidths.notaTrimestre;
        }

        currentY += headerLevel2Height;

        // ============ NIVEL 3: Micro-columnas CON TEXTO ROTADO -90° ============
        xPos = startX + colWidths.asignatura;

        for (let i = 0; i < 3; i++) {
            // APORTE: PROMEDIO | 70%
            doc
                .rect(xPos, currentY, microWidths.promedio, headerLevel3Height)
                .stroke('#000');
            this.dibujarTextoRotado(doc, 'PROMEDIO', xPos, currentY, microWidths.promedio, headerLevel3Height);
            xPos += microWidths.promedio;

            doc
                .rect(xPos, currentY, microWidths.ponderado70, headerLevel3Height)
                .stroke('#000');
            this.dibujarTextoRotado(doc, '70%', xPos, currentY, microWidths.ponderado70, headerLevel3Height);
            xPos += microWidths.ponderado70;

            // SUMATIVA: PROYECTO INTEGRADOR | 15% | PRUEBA ESTRUCTURADA | 15%
            doc
                .rect(xPos, currentY, microWidths.proyectoIntegrador, headerLevel3Height)
                .stroke('#000');
            this.dibujarTextoRotado(doc, 'PROYECTO', xPos, currentY, microWidths.proyectoIntegrador, headerLevel3Height);
            xPos += microWidths.proyectoIntegrador;

            doc
                .rect(xPos, currentY, microWidths.ponderado15_1, headerLevel3Height)
                .stroke('#000');
            this.dibujarTextoRotado(doc, '15%', xPos, currentY, microWidths.ponderado15_1, headerLevel3Height);
            xPos += microWidths.ponderado15_1;

            doc
                .rect(xPos, currentY, microWidths.pruebaEstructurada, headerLevel3Height)
                .stroke('#000');
            this.dibujarTextoRotado(doc, 'EXAMEN', xPos, currentY, microWidths.pruebaEstructurada, headerLevel3Height);
            xPos += microWidths.pruebaEstructurada;

            doc
                .rect(xPos, currentY, microWidths.ponderado15_2, headerLevel3Height)
                .stroke('#000');
            this.dibujarTextoRotado(doc, '15%', xPos, currentY, microWidths.ponderado15_2, headerLevel3Height);
            xPos += microWidths.ponderado15_2;

            // NOTA TRIMESTRE: TOTAL | EQUIV
            doc
                .rect(xPos, currentY, microWidths.notaTotal, headerLevel3Height)
                .stroke('#000');
            this.dibujarTextoRotado(doc, 'NOTA TOTAL', xPos, currentY, microWidths.notaTotal, headerLevel3Height);
            xPos += microWidths.notaTotal;

            doc
                .rect(xPos, currentY, microWidths.equivalencia, headerLevel3Height)
                .stroke('#000');
            this.dibujarTextoRotado(doc, 'EQUIVALENCIA', xPos, currentY, microWidths.equivalencia, headerLevel3Height);
            xPos += microWidths.equivalencia;
        }

        currentY += headerLevel3Height;
        // ============ FILAS DE MATERIAS ============
        doc.fontSize(5).font('Helvetica');

        // Obtener todas las materias únicas
        const todasMaterias = new Set<string>();
        datos.trimestres.forEach(trim => {
            trim.materias.forEach(mat => todasMaterias.add(mat.materia_nombre));
        });

        const materiasArray = Array.from(todasMaterias);
        materiasArray.forEach((materiaNombre, index) => {
            const rowHeight = 10;

            // Celda de asignatura
            doc.rect(startX, currentY, colWidths.asignatura, rowHeight).stroke('#000');
            doc.fontSize(5).font('Helvetica')
                .text(materiaNombre, startX + 2, currentY + 2, {
                    width: colWidths.asignatura - 4,
                    ellipsis: true
                });

            xPos = startX + colWidths.asignatura;

            // Datos por trimestre
            for (let trimestreNum = 1; trimestreNum <= 3; trimestreNum++) {
                const trimestre = datos.trimestres.find(t => t.trimestre_numero === trimestreNum);
                const materia = trimestre?.materias.find(m => m.materia_nombre === materiaNombre);

                // APORTE: Promedio
                doc.rect(xPos, currentY, microWidths.promedio, rowHeight).stroke('#000');
                const promedio = materia?.promedio_insumos ?? null;
                doc.text(promedio !== null ? promedio.toFixed(2) : '-', xPos, currentY + 2, {
                    width: microWidths.promedio,
                    align: 'center'
                });
                xPos += microWidths.promedio;

                // APORTE: 70%
                doc.rect(xPos, currentY, microWidths.ponderado70, rowHeight).stroke('#000');
                const ponderado70 = materia?.ponderado_insumos ?? null;
                doc.text(ponderado70 !== null ? ponderado70.toFixed(2) : '-', xPos, currentY + 2, {
                    width: microWidths.ponderado70,
                    align: 'center'
                });
                xPos += microWidths.ponderado70;

                // SUMATIVA: Proyecto
                doc.rect(xPos, currentY, microWidths.proyectoIntegrador, rowHeight).stroke('#000');
                const proyecto = materia?.nota_proyecto ?? null;
                doc.text(proyecto !== null ? proyecto.toFixed(2) : '-', xPos, currentY + 2, {
                    width: microWidths.proyectoIntegrador,
                    align: 'center'
                });
                xPos += microWidths.proyectoIntegrador;

                // SUMATIVA: 15% (Proyecto)
                doc.rect(xPos, currentY, microWidths.ponderado15_1, rowHeight).stroke('#000');
                const ponderado15_1 = materia?.ponderado_proyecto ?? null;
                doc.text(ponderado15_1 !== null ? ponderado15_1.toFixed(2) : '-', xPos, currentY + 2, {
                    width: microWidths.ponderado15_1,
                    align: 'center'
                });
                xPos += microWidths.ponderado15_1;

                // SUMATIVA: Examen
                doc.rect(xPos, currentY, microWidths.pruebaEstructurada, rowHeight).stroke('#000');
                const examen = materia?.nota_examen ?? null;
                doc.text(examen !== null ? examen.toFixed(2) : '-', xPos, currentY + 2, {
                    width: microWidths.pruebaEstructurada,
                    align: 'center'
                });
                xPos += microWidths.pruebaEstructurada;

                // SUMATIVA: 15% (Examen)
                doc.rect(xPos, currentY, microWidths.ponderado15_2, rowHeight).stroke('#000');
                const ponderado15_2 = materia?.ponderado_examen ?? null;
                doc.text(ponderado15_2 !== null ? ponderado15_2.toFixed(2) : '-', xPos, currentY + 2, {
                    width: microWidths.ponderado15_2,
                    align: 'center'
                });
                xPos += microWidths.ponderado15_2;

                // NOTA TRIMESTRE: Total
                doc.rect(xPos, currentY, microWidths.notaTotal, rowHeight).stroke('#000');
                const notaTotal = materia?.nota_final ?? null;
                doc.text(notaTotal !== null ? notaTotal.toFixed(2) : '-', xPos, currentY + 2, {
                    width: microWidths.notaTotal,
                    align: 'center'
                });
                xPos += microWidths.notaTotal;

                // NOTA TRIMESTRE: Equivalencia
                doc.rect(xPos, currentY, microWidths.equivalencia, rowHeight).stroke('#000');
                const equivalencia = materia?.cualitativa ?? '';
                doc.text(equivalencia, xPos, currentY + 2, {
                    width: microWidths.equivalencia,
                    align: 'center'
                });
                xPos += microWidths.equivalencia;
            }

            // ✅ PROMEDIO FINAL: Buscar el promedio_anual de esta materia específica
            doc.rect(xPos, currentY, colWidths.promedioFinal, rowHeight).stroke('#000');

            const promedioAnualData = datos.promedios_anuales?.find(
                p => p.materia_nombre === materiaNombre
            );

            const promedioAnual = promedioAnualData?.promedio_anual ?? null;

            doc.text(
                promedioAnual !== null ? promedioAnual.toFixed(2) : '-',
                xPos,
                currentY + 2,
                {
                    width: colWidths.promedioFinal,
                    align: 'center'
                }
            );
            xPos += colWidths.promedioFinal;

            // ✅ CUALITATIVA ANUAL: Buscar en datos.promedios_anuales
            doc.rect(xPos, currentY, colWidths.cualitativa, rowHeight).stroke('#000');

            const cualitativaAnual = promedioAnualData?.cualitativa ?? '';

            doc.text(cualitativaAnual, xPos, currentY + 2, {
                width: colWidths.cualitativa,
                align: 'center'
            });

            currentY += rowHeight;
        });

        // ============ FILA DE PROMEDIOS ============
        const rowHeight = 10;
        doc
            .rect(startX, currentY, finalTableWidth, rowHeight)
            .fillOpacity(0.2)
            .fill('#CCCCCC')
            .fillOpacity(1)
            .stroke('#000');

        doc
            .font('Helvetica-Bold')
            .fillColor('#000')
            .fontSize(5)
            .text('PROMEDIOS', startX + 1, currentY + 2, { width: colWidths.asignatura - 2 });

        xPos = startX + colWidths.asignatura;

        // Promedios por trimestre
        for (let trimestreNum = 1; trimestreNum <= 3; trimestreNum++) {
            const trimestreData = datos.trimestres.find(t => t.trimestre_numero === trimestreNum);

            if (trimestreData && trimestreData.materias.length > 0) {
                const materias = trimestreData.materias;
                const totalMaterias = materias.length;

                // ✅ PROMEDIO de columna PROMEDIO
                const avgPromedio = materias.reduce((sum, m) => sum + (m.promedio_insumos || 0), 0) / totalMaterias;

                // ✅ PROMEDIO de columna 70%
                const avgPonderado70 = materias.reduce((sum, m) => sum + (m.ponderado_insumos || 0), 0) / totalMaterias;

                // ✅ PROMEDIO de columna PROYECTO
                const avgProyecto = materias.reduce((sum, m) => sum + (m.nota_proyecto || 0), 0) / totalMaterias;

                // ✅ PROMEDIO de columna 15% (proyecto)
                const avgPonderado15_1 = materias.reduce((sum, m) => sum + (m.ponderado_proyecto || 0), 0) / totalMaterias;

                // ✅ PROMEDIO de columna EXAMEN
                const avgExamen = materias.reduce((sum, m) => sum + (m.nota_examen || 0), 0) / totalMaterias;

                // ✅ PROMEDIO de columna 15% (examen)
                const avgPonderado15_2 = materias.reduce((sum, m) => sum + (m.ponderado_examen || 0), 0) / totalMaterias;

                // ✅ PROMEDIO de columna NOTA TOTAL
                const avgNotaTotal = materias.reduce((sum, m) => sum + m.nota_final, 0) / totalMaterias;

                // ✅ CUALITATIVA basada en avgNotaTotal
                const cualitativaPromedio = this.obtenerCualitativa(avgNotaTotal);

                // DIBUJAR CADA PROMEDIO EN SU COLUMNA

                // Columna PROMEDIO
                doc.rect(xPos, currentY, microWidths.promedio, rowHeight).stroke();
                doc.text(avgPromedio.toFixed(2), xPos + 1, currentY + 2, { width: microWidths.promedio - 2, align: 'center' });
                xPos += microWidths.promedio;

                // Columna 70%
                doc.rect(xPos, currentY, microWidths.ponderado70, rowHeight).stroke();
                doc.text(avgPonderado70.toFixed(2), xPos + 1, currentY + 2, { width: microWidths.ponderado70 - 2, align: 'center' });
                xPos += microWidths.ponderado70;

                // Columna PROYECTO
                doc.rect(xPos, currentY, microWidths.proyectoIntegrador, rowHeight).stroke();
                doc.text(avgProyecto.toFixed(2), xPos + 1, currentY + 2, { width: microWidths.proyectoIntegrador - 2, align: 'center' });
                xPos += microWidths.proyectoIntegrador;

                // Columna 15% (proyecto)
                doc.rect(xPos, currentY, microWidths.ponderado15_1, rowHeight).stroke();
                doc.text(avgPonderado15_1.toFixed(2), xPos + 1, currentY + 2, { width: microWidths.ponderado15_1 - 2, align: 'center' });
                xPos += microWidths.ponderado15_1;

                // Columna EXAMEN
                doc.rect(xPos, currentY, microWidths.pruebaEstructurada, rowHeight).stroke();
                doc.text(avgExamen.toFixed(2), xPos + 1, currentY + 2, { width: microWidths.pruebaEstructurada - 2, align: 'center' });
                xPos += microWidths.pruebaEstructurada;

                // Columna 15% (examen)
                doc.rect(xPos, currentY, microWidths.ponderado15_2, rowHeight).stroke();
                doc.text(avgPonderado15_2.toFixed(2), xPos + 1, currentY + 2, { width: microWidths.ponderado15_2 - 2, align: 'center' });
                xPos += microWidths.ponderado15_2;

                // Columna NOTA TOTAL
                doc.rect(xPos, currentY, microWidths.notaTotal, rowHeight).stroke();
                doc.text(avgNotaTotal.toFixed(2), xPos + 1, currentY + 2, { width: microWidths.notaTotal - 2, align: 'center' });
                xPos += microWidths.notaTotal;

                // Columna EQUIVALENCIA (cualitativa)
                doc.rect(xPos, currentY, microWidths.equivalencia, rowHeight).stroke();
                doc.text(cualitativaPromedio, xPos + 1, currentY + 2, { width: microWidths.equivalencia - 2, align: 'center' });
                xPos += microWidths.equivalencia;

            } else {
                // Si no hay datos, dibujar columnas vacías
                const totalWidth = subColWidths.aporte + subColWidths.sumativa + subColWidths.notaTrimestre;
                doc.rect(xPos, currentY, totalWidth, rowHeight).stroke();
                doc.text('-', xPos + (totalWidth / 2) - 5, currentY + 2);
                xPos += totalWidth;
            }
        }

        // Promedio general anual
        if (datos.promedio_general_anual !== null) {
            doc.rect(xPos, currentY, colWidths.promedioFinal, rowHeight).stroke();
            doc.text(datos.promedio_general_anual.toFixed(2), xPos + 1, currentY + 2, {
                width: colWidths.promedioFinal - 2,
                align: 'center'
            });
        } else {
            doc.rect(xPos, currentY, colWidths.promedioFinal, rowHeight).stroke();
            doc.text('-', xPos + 1, currentY + 2, { width: colWidths.promedioFinal - 2, align: 'center' });
        }
        xPos += colWidths.promedioFinal;

        // Cualitativa general
        if (datos.cualitativa_general_anual) {
            doc.rect(xPos, currentY, colWidths.cualitativa, rowHeight).stroke();
            doc.text(datos.cualitativa_general_anual, xPos + 1, currentY + 2, {
                width: colWidths.cualitativa - 2,
                align: 'center'
            });
        } else {
            doc.rect(xPos, currentY, colWidths.cualitativa, rowHeight).stroke();
            doc.text('-', xPos + 1, currentY + 2, { width: colWidths.cualitativa - 2, align: 'center' });
        }

        currentY += rowHeight + 15; // Espacio después de PROMEDIOS


        // ============ VALIDAR SI ES BÁSICA O BACHILLERATO ============
        const nivelesBasica = ['OCTAVO', 'NOVENO', 'DECIMO'];
        const esBasica = nivelesBasica.includes(datos.curso.nivel);

        if (esBasica) {
            // BÁSICA: Comportamiento + Componentes educativos
            this.dibujarComponentesEducativosBasica(doc, datos, currentY);
        } else {
            // BACHILLERATO: Comportamiento + Tutoría
            this.dibujarComponentesEducativosBachillerato(doc, datos, currentY);
        }

    }
    // ==================== COMPONENTES EDUCATIVOS PARA BÁSICA ====================
    private dibujarComponentesEducativosBasica(doc: PDFKit.PDFDocument, datos: DatosLibretaEstudiante, startY: number) {
        const marginLeft = 30;
        const pageWidth = doc.page.width;
        const marginRight = 30;

        let currentY = startY - 8;

        // ============ DIMENSIONES DE LAS TABLAS (LADO A LADO) ============
        const tabla1Width = 380;
        const tabla2Width = 370;
        const espacioEntreTables = 10;

        const rowHeight = 12;

        let tabla1X = marginLeft;
        let tabla2X = marginLeft + tabla1Width + espacioEntreTables;

        // ============ TABLA 1: EVALUACIÓN COMPORTAMENTAL ============
        // ✅ Sin franja gris separada - todo integrado en filas normales

        const col1Width = 280;
        const calificacionWidth = 100;

        // ✅ Primera fila: "EVALUACIÓN COMPORTAMENTAL" como título integrado
        let xPos = tabla1X;

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

        // Filas de comportamiento (4 filas: 3 trimestres + comportamiento final)
        const filas = [
            { nombre: 'Primer trimestre', calificacion: 'A' },
            { nombre: 'Segundo trimestre', calificacion: 'A+' },
            { nombre: 'Tercer trimestre', calificacion: 'A+' },
            { nombre: 'Comportamiento final', calificacion: 'B+' }
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

        // ============ TABLA 2: COMPONENTES EDUCATIVOS ============
        currentY = startY - 8; // ✅ Resetear a la misma altura inicial

        // Dimensiones tabla 2
        const t2Col1Width = 100;
        const t2TrimestreWidth = 60;
        const t2PromedioWidth = 70;

        xPos = tabla2X;

        // ✅ Primera fila: Encabezado con altura simple (igual que tabla 1)
        doc.rect(xPos, currentY, t2Col1Width, rowHeight).stroke('#000');
        doc.fontSize(6).font('Helvetica-Bold')
            .text('TRIMESTRE', xPos, currentY + 3, { width: t2Col1Width, align: 'center' });
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

        // ✅ Filas de componentes educativos (4 filas para igualar tabla 1)
        const componentes = [
            { nombre: 'Animación Lectora', valores: ['-', '-', '-', 'PA'] },
            { nombre: 'Orientación Vocacional y Profesional (OVP)', valores: ['-', '-', '-', 'AA'] },
            { nombre: 'Acompañamiento integral al estudiante (TUTORÍAS)', valores: ['P', 'B', '-', 'DA'] }
        ];

        componentes.forEach((componente) => {
            xPos = tabla2X;

            // Nombre componente
            doc.rect(xPos, currentY, t2Col1Width, rowHeight).stroke('#000');
            doc.fontSize(4.5).font('Helvetica')
                .text(componente.nombre, xPos + 2, currentY + 3, {
                    width: t2Col1Width - 4,
                    lineBreak: false,
                    ellipsis: true
                });
            xPos += t2Col1Width;

            // Trimestre 1
            doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
            doc.fontSize(6).text(componente.valores[0], xPos, currentY + 3, {
                width: t2TrimestreWidth,
                align: 'center'
            });
            xPos += t2TrimestreWidth;

            // Trimestre 2
            doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
            doc.text(componente.valores[1], xPos, currentY + 3, {
                width: t2TrimestreWidth,
                align: 'center'
            });
            xPos += t2TrimestreWidth;

            // Trimestre 3
            doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
            doc.text(componente.valores[2], xPos, currentY + 3, {
                width: t2TrimestreWidth,
                align: 'center'
            });
            xPos += t2TrimestreWidth;

            // Promedio
            doc.rect(xPos, currentY, t2PromedioWidth, rowHeight).stroke('#000');
            doc.text(componente.valores[3], xPos, currentY + 3, {
                width: t2PromedioWidth,
                align: 'center'
            });

            currentY += rowHeight;
        });

        // ✅ Agregar 1 fila vacía para igualar altura (tabla 1: 5 filas total, tabla 2: 4 filas + 1 vacía = 5)
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
    }

    // ==================== COMPONENTES EDUCATIVOS PARA BACHILLERATO ====================
    private dibujarComponentesEducativosBachillerato(doc: PDFKit.PDFDocument, datos: DatosLibretaEstudiante, startY: number) {
        const marginLeft = 30;
        const pageWidth = doc.page.width;
        const marginRight = 30;

        let currentY = startY - 8;

        // ============ DIMENSIONES DE LAS TABLAS (LADO A LADO) ============
        const tabla1Width = 380;
        const tabla2Width = 370;
        const espacioEntreTables = 10;

        const rowHeight = 12;

        let tabla1X = marginLeft;
        let tabla2X = marginLeft + tabla1Width + espacioEntreTables;

        // ============ TABLA 1: EVALUACIÓN COMPORTAMENTAL ============
        const col1Width = 280;
        const calificacionWidth = 100;

        // ✅ Primera fila: "EVALUACIÓN COMPORTAMENTAL" como título integrado
        let xPos = tabla1X;

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

        // Filas de comportamiento
        const filas = [
            { nombre: 'Primer trimestre', calificacion: 'A' },
            { nombre: 'Segundo trimestre', calificacion: 'A+' },
            { nombre: 'Tercer trimestre', calificacion: 'A+' },
            { nombre: 'Comportamiento final', calificacion: 'B+' }
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

        // ============ TABLA 2: TUTORÍA ============
        currentY = startY - 8;

        // Dimensiones tabla 2
        const t2Col1Width = 100;
        const t2TrimestreWidth = 60;
        const t2PromedioWidth = 70;

        xPos = tabla2X;

        // ✅ Primera fila: Encabezado simple
        doc.rect(xPos, currentY, t2Col1Width, rowHeight).stroke('#000');
        doc.fontSize(6).font('Helvetica-Bold')
            .text('TRIMESTRE', xPos, currentY + 3, { width: t2Col1Width, align: 'center' });
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

        // ✅ Solo Tutoría
        xPos = tabla2X;

        doc.rect(xPos, currentY, t2Col1Width, rowHeight).stroke('#000');
        doc.fontSize(5).font('Helvetica')
            .text('Acompañamiento integral al estudiante (TUTORÍAS)', xPos + 2, currentY + 3, {
                width: t2Col1Width - 4,
                lineBreak: false,
                ellipsis: true
            });
        xPos += t2Col1Width;

        doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
        doc.fontSize(6).text('P', xPos, currentY + 3, { width: t2TrimestreWidth, align: 'center' });
        xPos += t2TrimestreWidth;

        doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
        doc.text('B', xPos, currentY + 3, { width: t2TrimestreWidth, align: 'center' });
        xPos += t2TrimestreWidth;

        doc.rect(xPos, currentY, t2TrimestreWidth, rowHeight).stroke('#000');
        doc.text('-', xPos, currentY + 3, { width: t2TrimestreWidth, align: 'center' });
        xPos += t2TrimestreWidth;

        doc.rect(xPos, currentY, t2PromedioWidth, rowHeight).stroke('#000');
        doc.text('DA', xPos, currentY + 3, { width: t2PromedioWidth, align: 'center' });

        currentY += rowHeight;

        // ✅ Agregar 3 filas vacías para igualar altura (tabla 1: 5 filas, tabla 2: 2 + 3 vacías = 5)
        for (let i = 0; i < 3; i++) {
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
                `Periodo ${datos.periodo.nombre}`,
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
            .text('ESCALA DE CALIFICACIONES (ART.194 RGLOEI)', xPos + 2, currentY + 2, {
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

        currentY += 5; // Espacio entre línea y texto

        // ============ NOMBRE DEL DOCENTE (CENTRADO) ============
        const docenteNombre = datos.docente
            ? `${datos.docente.apellidos} ${datos.docente.nombres}`.toUpperCase()
            : 'SIN ASIGNAR';

        doc.fontSize(7).font('Helvetica-Bold').fillColor('#000')
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
        doc.fontSize(7).font('Helvetica').fillColor('#000')
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
}