/**
 * SISTEMA PDF HÍBRIDO
 * - Vista previa: HTML (mantiene calidad visual)
 * - Descarga: jsPDF (control total)
 */

import { 
  obtenerUltimoInforme,
  obtenerTotales 
} from './informes.js';

import {
  generarFechaFormateada,
  generarCodigoRef,
  precioFormatearEuro
} from './utils.js';

import {
  calcularNumeroLamas,
  DESCRIPCIONES_MONT
} from './calculosPergola.js';

// Variables globales
let logoBase64 = null;
let modalAbierto = false;
let tipoDocumentoActual = 'material';
let vistaPreviaGestos = null;

const CONFIG_PDF = {
  LOGO_PATH: './js/logo.png',
  LOGO_ANCHO_MM: 30
};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

export async function inicializarSistemaPDF() {
  await cargarLogo();
  
  const btnVistaPrevia = document.getElementById('btnVistaPreviaPDF');
  const btnWhatsApp = document.getElementById('btnCompartirWhatsApp');
  const btnCerrarModal = document.getElementById('btnCerrarModal');
  const btnCerrarModalFooter = document.getElementById('btnCerrarModalFooter');
  const btnDescargarDesdeModal = document.getElementById('btnDescargarDesdeModal');

  if (btnVistaPrevia) btnVistaPrevia.addEventListener('click', abrirVistaPreviaPDF);
  if (btnWhatsApp) btnWhatsApp.addEventListener('click', compartirWhatsApp);
  if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
  if (btnCerrarModalFooter) btnCerrarModalFooter.addEventListener('click', cerrarModal);
  if (btnDescargarDesdeModal) btnDescargarDesdeModal.addEventListener('click', descargarPDFDesdeModal);

  const overlay = document.querySelector('.pdf-modal-overlay');
  if (overlay) overlay.addEventListener('click', cerrarModal);

  console.log('✅ Sistema PDF híbrido inicializado');
}

async function cargarLogo() {
  try {
    const response = await fetch(CONFIG_PDF.LOGO_PATH);
    if (!response.ok) {
      console.warn('⚠️ Logo no encontrado');
      return;
    }
    
    const blob = await response.blob();
    logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    
    console.log('✅ Logo cargado');
  } catch (error) {
    console.error('❌ Error al cargar logo:', error);
  }
}

// ============================================================================
// FUNCIONES DEL MODAL (SIN CAMBIOS - VISTA PREVIA HTML)
// ============================================================================

export function abrirVistaPreviaPDF() {
  console.log('👁️ Abriendo vista previa...');

  // Validar datos obligatorios antes de abrir
  const inputComercial = document.getElementById('comercial');
  const inputCliente = document.getElementById('cliente');
  const inputRefObra = document.getElementById('refObra');
  
  // Debug: verificar que los elementos existen
  console.log('Elementos encontrados:', {
    comercial: !!inputComercial,
    cliente: !!inputCliente,
    refObra: !!inputRefObra
  });
  
  const comercial = inputComercial?.value?.trim();
  const cliente = inputCliente?.value?.trim();
  const refObra = inputRefObra?.value?.trim();
  
  // Debug: verificar valores
  console.log('Valores leídos:', {
    comercial: comercial || '(vacío)',
    cliente: cliente || '(vacío)',
    refObra: refObra || '(vacío)'
  });

  if (!comercial || comercial === '') {
    alert('⚠️ ATENCIÓN: Debes rellenar el campo "Comercial" antes de generar la vista previa.');
    return;
  }

  if (!cliente || cliente === '') {
    alert('⚠️ ATENCIÓN: Debes rellenar el campo "Cliente" antes de generar la vista previa.');
    return;
  }

  if (!refObra || refObra === '') {
    alert('⚠️ ATENCIÓN: Debes rellenar el campo "Ref. obra" antes de generar la vista previa.');
    return;
  }

  const tipo = obtenerTipoDocumento();
  tipoDocumentoActual = tipo;

  const htmlPaginado = generarDocumentoPaginado(tipo);
  if (!htmlPaginado) {
    alert('No hay datos calculados. Por favor, calcula primero la configuración.');
    return;
  }

  const modalContent = document.getElementById('pdfPreviewContent');
  if (!modalContent) {
    console.error('❌ No se encuentra el contenedor del modal');
    return;
  }

  modalContent.innerHTML = htmlPaginado;

  const modal = document.getElementById('pdfPreviewModal');
  if (modal) {
    modal.style.display = 'block';
    modalAbierto = true;
    habilitarGestosVistaPrevia();
    console.log('✅ Modal abierto con vista previa HTML');
  }
}

export function cerrarModal() {
  const modal = document.getElementById('pdfPreviewModal');
  if (modal) {
    modal.style.display = 'none';
    modalAbierto = false;
  }
  deshabilitarGestosVistaPrevia();
}

// ============================================================================
// DESCARGA PDF CON jsPDF (NUEVA IMPLEMENTACIÓN)
// ============================================================================

export async function descargarPDFDesdeModal() {
  console.log('📥 Generando PDF con jsPDF...');

  if (typeof window.jspdf === 'undefined') {
    alert('Error: Librería jsPDF no encontrada.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');

  const modalContent = document.getElementById('pdfPreviewContent');
  if (!modalContent) {
    alert('Error: No se encuentra el contenido.');
    return;
  }

  try {
    // Extraer datos del HTML
    const datos = extraerDatosDelModal(modalContent);
    
    // VALIDACIÓN: Verificar que comercial, cliente y ref obra están rellenos
    if (!datos.comercial || datos.comercial === '—' || !datos.comercial.trim()) {
      alert('⚠️ ATENCIÓN: Debes rellenar el campo "Comercial" antes de generar el documento.');
      return;
    }
    
    if (!datos.cliente || datos.cliente === '—' || !datos.cliente.trim()) {
      alert('⚠️ ATENCIÓN: Debes rellenar el campo "Cliente" antes de generar el documento.');
      return;
    }
    
    if (!datos.refObra || datos.refObra === '—' || !datos.refObra.trim()) {
      alert('⚠️ ATENCIÓN: Debes rellenar el campo "Ref. obra" antes de generar el documento.');
      return;
    }
    
    // Generar PDF según el tipo de documento
    if (tipoDocumentoActual === 'peso') {
      await generarPDFPeso(doc, datos);
    } else if (tipoDocumentoActual === 'corte') {
      await generarPDFCorte(doc, datos, modalContent);
    } else {
      // Material (presupuesto) - código original
      const materiales = extraerMaterialesDelModal(modalContent);
      const totales = extraerTotalesDelModal(modalContent);
      const svgImagen = await convertirSVGaImagen(modalContent);
      await generarPDFconJsPDF(doc, datos, materiales, totales, svgImagen);
    }

    // Descargar
    const nombreArchivo = generarNombreArchivo(tipoDocumentoActual);
    doc.save(nombreArchivo);
    
    console.log('✅ PDF generado correctamente');
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    alert('Error al generar el PDF. Ver consola para detalles.');
  }
}

async function generarPDFconJsPDF(doc, datos, materiales, totales, svgImagen) {
  let y = 15;
  const marginX = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (marginX * 2);

  // ========== CABECERA ==========
  
  // Logo (izquierda)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', marginX, y, 30, 15);
    } catch (e) {
      console.warn('⚠️ Error al añadir logo:', e);
    }
  }

  // Título y fecha (derecha)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 84, 166);
  doc.text('Presupuesto Pérgola Bioclimática · Doha Sun', pageWidth - marginX, y + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Fecha: ${datos.fecha || ''}`, pageWidth - marginX, y + 14, { align: 'right' });

  y += 20;

  // Línea divisoria
  doc.setDrawColor(209, 213, 219);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  // ========== RESUMEN DE CONFIGURACIÓN ==========

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(31, 41, 55);
  doc.text('Resumen de configuración', marginX, y);

  y += 7;

  // Ref. presupuesto
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Ref. presupuesto: ${datos.codigoPresupuesto}`, marginX, y);
  y += 8;

  // **Datos comerciales en HORIZONTAL (3 columnas)**
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);

  const columnaWidth = contentWidth / 3; // Dividir en 3 columnas iguales
  const espacioEtiqueta = 3; // Espacio adicional entre etiqueta y valor

  // Comercial (columna 1)
  doc.setFont('helvetica', 'bold');
  doc.text('Comercial:', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.comercial, marginX + doc.getTextWidth('Comercial:') + espacioEtiqueta, y);

  // Cliente (columna 2)
  const xColumna2 = marginX + columnaWidth;
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', xColumna2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.cliente, xColumna2 + doc.getTextWidth('Cliente:') + espacioEtiqueta, y);

  // Ref. obra (columna 3)
  const xColumna3 = marginX + (columnaWidth * 2);
  doc.setFont('helvetica', 'bold');
  doc.text('Ref. obra:', xColumna3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.refObra, xColumna3 + doc.getTextWidth('Ref. obra:') + espacioEtiqueta, y);

  y += 5; // Espacio antes del recuadro azul

  // Recuadro azul con datos principales
  const recuadroHeight = 45;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(marginX, y, contentWidth, recuadroHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.text('Datos principales', marginX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);

  let yDatos = y + 12;

  // **Función simplificada para renderizar líneas con etiquetas en negrita**
  const renderLinea = (etiquetas, valores) => {
    let xActual = marginX + 6;
    doc.text('• ', xActual, yDatos);
    xActual += doc.getTextWidth('• ');
    
    // Renderizar cada par etiqueta:valor
    for (let i = 0; i < etiquetas.length; i++) {
      doc.setFont('helvetica', 'bold');
      doc.text(etiquetas[i] + ':', xActual, yDatos);
      xActual += doc.getTextWidth(etiquetas[i] + ':') + 1;
      
      doc.setFont('helvetica', 'normal');
      const valor = valores[i] + (i < etiquetas.length - 1 ? ' · ' : '');
      doc.text(valor, xActual, yDatos);
      xActual += doc.getTextWidth(valor);
    }
    
    yDatos += 5;
  };

  // Renderizar datos
  renderLinea(['Largo/salida', 'Ancho', 'Altura libre'], 
              [`${datos.salida} m`, `${datos.ancho} m`, `${datos.altura} m`]);
  renderLinea(['Módulos'], [datos.modulos]);
  renderLinea(['Tipo de montaje'], [datos.tipoMontaje]);
  renderLinea(['Nº pilares calculados'], [datos.numPilares]);
  renderLinea(['Motores'], [datos.motores]);
  renderLinea(['Número de lamas'], [datos.numLamas]);
  renderLinea(['Mando'], [datos.mando]);

  y += recuadroHeight + 5;

  // Bloque de aviso (si existe)
  if (datos.avisoRefuerzo && datos.avisoRefuerzo.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    const margenInternoAviso = 6;
    const textoAviso = doc.splitTextToSize(datos.avisoRefuerzo, contentWidth - margenInternoAviso);
    const numLineas = textoAviso.length;
    const alturaLinea = 4;
    const avisoHeight = Math.max(12, (numLineas * alturaLinea) + 6);
    
    doc.setFillColor(254, 249, 195);
    doc.setDrawColor(252, 211, 77);
    doc.roundedRect(marginX, y, contentWidth, avisoHeight, 2, 2, 'FD');
    
    doc.setTextColor(146, 64, 14);
    
    let yTextoAviso = y + 5;
    textoAviso.forEach(linea => {
      doc.text(linea, marginX + 3, yTextoAviso);
      yTextoAviso += alturaLinea;
    });
    
    y += avisoHeight + 5;
  }

  // ========== SVG ESQUEMA ==========
  
  if (svgImagen) {
    try {
      // Cargar imagen para obtener sus dimensiones reales
      const img = new Image();
      img.src = svgImagen;
      
      await new Promise((resolve) => {
        img.onload = () => {
          const proporcion = img.width / img.height;
          
          // OPCIÓN 1: Partir de altura fija
          let altoEnPDF = 80;  // 80mm de alto
          let anchoEnPDF = altoEnPDF * proporcion;
          
          // LÍMITE: Si el ancho excede el espacio disponible, limitar por ancho
          if (anchoEnPDF > contentWidth) {
            console.log(`⚠️ SVG demasiado ancho (${anchoEnPDF.toFixed(1)}mm), limitando a ${contentWidth}mm`);
            anchoEnPDF = contentWidth;  // Limitar al ancho máximo
            altoEnPDF = anchoEnPDF / proporcion;  // Recalcular altura proporcionalmente
          }
          
          // Centrar horizontalmente
          const xCentrado = marginX + (contentWidth - anchoEnPDF) / 2;
          
          doc.addImage(svgImagen, 'PNG', xCentrado, y, anchoEnPDF, altoEnPDF);
          
          console.log(`✅ SVG añadido: ${anchoEnPDF.toFixed(1)}mm x ${altoEnPDF.toFixed(1)}mm (proporción ${proporcion.toFixed(2)}:1)`);
          
          y += altoEnPDF + 8;  // Usar altura real + margen
          resolve();
        };
        img.onerror = () => {
          console.warn('⚠️ Error al cargar imagen SVG');
          y += 5;
          resolve();
        };
      });
    } catch (e) {
      console.warn('⚠️ Error al añadir SVG:', e);
      y += 5;
    }
  }

// ========== TABLA DE MATERIALES ==========
  
doc.setFont('helvetica', 'bold');
doc.setFontSize(12);
doc.setTextColor(31, 41, 55);
doc.text('Informe de material', marginX, y);
y += 6;

// Tabla con autotable - CONFIGURACIÓN MEJORADA
doc.autoTable({
  startY: y,
  head: [[
    'TIPO',
    'REF.',
    'DESCRIPCIÓN',
    'ACABADO',
    'REF. ACABADO',
    'LONG. BARRA (m)',
    'Nº BARRAS / UDS',
    'PRECIO UNIT. (€)',
    'IMPORTE (€)'
  ]],
  body: materiales.map(m => {
    // ✅ Quitar la unidad (m) de la longitud de barra
    const longBarra = m.longitudBarra ? String(m.longitudBarra).replace(/\s*m$/i, '') : '—';
    const numBarras = m.numBarras || '—';
    const precioUnit = m.precioUnit || '0,00';
    const importe = m.importe || '0,00 €';
    const refAcabado = m.refAcabado || 'SIN ESPECIFICAR';
    
    return [
      m.tipo,
      m.ref,
      m.descripcion,
      m.acabado,
      refAcabado,
      longBarra,
      numBarras,
      precioUnit,
      importe
    ];
  }),
  styles: {
    fontSize: 7,
    cellPadding: 1,
    lineColor: [229, 231, 235],
    lineWidth: 0.1,
    valign: 'middle',
    overflow: 'linebreak',
    cellWidth: 'wrap'
  },
  headStyles: {
    fillColor: [243, 244, 246],
    textColor: [31, 41, 55],
    fontStyle: 'bold',
    fontSize: 7,
    lineColor: [209, 213, 219],
    lineWidth: 0.1,
    halign: 'center',
    valign: 'middle'
  },
  alternateRowStyles: {
    fillColor: [250, 250, 250]
  },
  margin: { left: marginX, right: marginX },
  tableWidth: contentWidth,
  
  rowPageBreak: 'avoid',
  
  // ✅ Anchos de columna optimizados
  columnStyles: {
    0: { cellWidth: 17, halign: 'left' },    // TIPO - Aumentado para "accesorio"
    1: { cellWidth: 12, halign: 'center' },  // REF.
    2: { cellWidth: 38, halign: 'left' },    // DESCRIPCIÓN
    3: { cellWidth: 16, halign: 'center' },  // ACABADO
    4: { cellWidth: 22, halign: 'center' },  // REF. ACABADO
    5: { cellWidth: 18, halign: 'center' },  // LONG. BARRA - Centrado
    6: { cellWidth: 18, halign: 'center' },  // ✅ Nº BARRAS - Centrado
    7: { cellWidth: 18, halign: 'center' },  // PRECIO UNIT. - Centrado
    8: { cellWidth: 15, halign: 'center' }   // IMPORTE - Centrado
  },
  
  didDrawPage: (data) => {
    const pageCount = doc.internal.pages.length - 1;
    const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Página ${pageNumber}`, marginX, 287);
    doc.setFont('helvetica', 'italic');
    doc.text('ALUMINIOS GALISUR · Pérgola Bioclimática Doha Sun', pageWidth - marginX, 287, { align: 'right' });
  }
});

y = doc.lastAutoTable.finalY + 8;

// ========== TOTALES (ANCHO COMPLETO) ==========

const espacioRestante = 297 - y;
if (espacioRestante < 45) {
  console.log(`⚠️ Espacio insuficiente (${espacioRestante.toFixed(1)}mm), añadiendo nueva página para totales`);
  doc.addPage();
  y = 20;
}

const totalesWidth = contentWidth;
const totalesX = marginX;

doc.setFillColor(249, 250, 251);
doc.setDrawColor(229, 231, 235);
doc.roundedRect(totalesX, y, totalesWidth, 30, 3, 3, 'FD');

doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(31, 41, 55);
doc.text('Resumen económico', totalesX + 4, y + 6);

doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(107, 114, 128);

let yTotal = y + 12;
doc.text('Total perfiles', totalesX + 4, yTotal);
doc.setTextColor(31, 41, 55);
doc.setFont('helvetica', 'bold');
doc.text(totales.perfiles, totalesX + totalesWidth - 4, yTotal, { align: 'right' });

yTotal += 5;
doc.setFont('helvetica', 'normal');
doc.setTextColor(107, 114, 128);
doc.text('Total accesorios', totalesX + 4, yTotal);
doc.setTextColor(31, 41, 55);
doc.setFont('helvetica', 'bold');
doc.text(totales.accesorios, totalesX + totalesWidth - 4, yTotal, { align: 'right' });

yTotal += 7;
doc.setDrawColor(3, 105, 161);
doc.line(totalesX + 4, yTotal - 2, totalesX + totalesWidth - 4, yTotal - 2);
doc.line(totalesX + 4, yTotal + 4, totalesX + totalesWidth - 4, yTotal + 4);

doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(3, 105, 161);
doc.text('Total materiales', totalesX + 4, yTotal + 2);
doc.text(totales.total, totalesX + totalesWidth - 4, yTotal + 2, { align: 'right' });

// ========== PIE DE PÁGINA ==========

const numPaginas = doc.internal.pages.length - 1;
for (let i = 1; i <= numPaginas; i++) {
  doc.setPage(i);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  
  doc.text(`Página ${i}`, marginX, 287);
  doc.setFont('helvetica', 'italic');
  doc.text('ALUMINIOS GALISUR · Pérgola Bioclimática Doha Sun', pageWidth - marginX, 287, { align: 'right' });
}
}

// ============================================================================
// GENERACIÓN PDF - PESOS Y PERÍMETROS
// ============================================================================

async function generarPDFPeso(doc, datos) {
  let y = 15;
  const marginX = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (marginX * 2);

  // ========== CABECERA (igual que presupuesto pero con título diferente) ==========
  
  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', marginX, y, 30, 15);
    } catch (e) {
      console.warn('⚠️ Error al añadir logo:', e);
    }
  }

  // Título y fecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 84, 166);
  doc.text('Pesos y perímetros Pérgola Bioclimática · Doha Sun', pageWidth - marginX, y + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Fecha: ${datos.fecha || ''}`, pageWidth - marginX, y + 14, { align: 'right' });

  y += 20;

  // Línea divisoria
  doc.setDrawColor(209, 213, 219);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  // ========== RESUMEN DE CONFIGURACIÓN (simplificado) ==========

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(31, 41, 55);
  doc.text('Resumen de configuración', marginX, y);

  y += 7;

  // Ref. presupuesto
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Ref. presupuesto: ${datos.codigoPresupuesto}`, marginX, y);
  y += 8;

  // Datos comerciales en horizontal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);

  const columnaWidth = contentWidth / 3;
  const espacioEtiqueta = 3;

  // Comercial
  doc.setFont('helvetica', 'bold');
  doc.text('Comercial:', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.comercial, marginX + doc.getTextWidth('Comercial:') + espacioEtiqueta, y);

  // Cliente
  const xColumna2 = marginX + columnaWidth;
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', xColumna2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.cliente, xColumna2 + doc.getTextWidth('Cliente:') + espacioEtiqueta, y);

  // Ref. obra
  const xColumna3 = marginX + (columnaWidth * 2);
  doc.setFont('helvetica', 'bold');
  doc.text('Ref. obra:', xColumna3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.refObra, xColumna3 + doc.getTextWidth('Ref. obra:') + espacioEtiqueta, y);

  y += 5;

  // Recuadro azul con datos simplificados
  const recuadroHeight = 25;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(marginX, y, contentWidth, recuadroHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.text('Información de la configuración', marginX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);

  let yDatos = y + 12;

  doc.text(`• Largo/salida: ${datos.salida} m · Ancho: ${datos.ancho} m · Altura libre: ${datos.altura} m`, marginX + 6, yDatos);
  yDatos += 5;
  doc.text(`• Módulos: ${datos.modulos} · Tipo de montaje: ${datos.tipoMontaje}`, marginX + 6, yDatos);

  y += recuadroHeight + 5;

  // Obtener datos del informe
  const informe = obtenerUltimoInforme();
  if (!informe || !informe.detallePesoPerimetro) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('No hay datos de pesos y perímetros disponibles.', marginX, y);
    return;
  }

  // ========== TABLA DE PESOS Y PERÍMETROS ==========
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Pesos y perímetros por perfil', marginX, y);
  y += 6;

  // Tabla con autotable
  const datosPeso = informe.detallePesoPerimetro.map(item => [
    item.ref || '—',
    item.descripcion || '—',
    (item.pesoTotal || 0).toFixed(2),
    (item.perimetroTotal || 0).toFixed(2)
  ]);

  doc.autoTable({
    startY: y,
    head: [['REFERENCIA', 'DESCRIPCIÓN', 'PESO TOTAL (kg)', 'PERÍMETRO (mm)']],
    body: datosPeso,
    foot: [[
      { content: 'TOTALES:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: informe.totales.pesoTotal.toFixed(2), styles: { fontStyle: 'bold', fillColor: [239, 246, 255] } },
      { content: informe.totales.perimetroTotal.toFixed(2), styles: { fontStyle: 'bold', fillColor: [239, 246, 255] } }
    ]],
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [31, 41, 55],
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: [209, 213, 219],
      halign: 'center'
    },
    footStyles: {
      fillColor: [239, 246, 255],
      textColor: [30, 64, 175],
      fontStyle: 'bold',
      lineColor: [191, 219, 254]
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 80, halign: 'left' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' }
    },
    margin: { left: marginX, right: marginX },
    didDrawPage: (data) => {
      const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`Página ${pageNumber}`, marginX, 287);
      doc.setFont('helvetica', 'italic');
      doc.text('ALUMINIOS GALISUR · Pérgola Bioclimática Doha Sun', pageWidth - marginX, 287, { align: 'right' });
    }
  });

  // ========== PIE DE PÁGINA ==========
  const numPaginas = doc.internal.pages.length - 1;
  for (let i = 1; i <= numPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Página ${i}`, marginX, 287);
    doc.setFont('helvetica', 'italic');
    doc.text('ALUMINIOS GALISUR · Pérgola Bioclimática Doha Sun', pageWidth - marginX, 287, { align: 'right' });
  }
}

// ============================================================================
// GENERACIÓN PDF - HOJA DE CORTE
// ============================================================================

async function generarPDFCorte(doc, datos, modalContent) {
  let y = 15;
  const marginX = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (marginX * 2);

  // ========== CABECERA ==========
  
  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', marginX, y, 30, 15);
    } catch (e) {
      console.warn('⚠️ Error al añadir logo:', e);
    }
  }

  // Título y fecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 84, 166);
  doc.text('Hoja de corte Pérgola Bioclimática · Doha Sun', pageWidth - marginX, y + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Fecha: ${datos.fecha || ''}`, pageWidth - marginX, y + 14, { align: 'right' });

  y += 20;

  // Línea divisoria
  doc.setDrawColor(209, 213, 219);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  // ========== RESUMEN DE CONFIGURACIÓN (simplificado) ==========

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(31, 41, 55);
  doc.text('Resumen de configuración', marginX, y);

  y += 7;

  // Ref. presupuesto
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Ref. presupuesto: ${datos.codigoPresupuesto}`, marginX, y);
  y += 8;

  // Datos comerciales
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);

  const columnaWidth = contentWidth / 3;
  const espacioEtiqueta = 3;

  doc.setFont('helvetica', 'bold');
  doc.text('Comercial:', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.comercial, marginX + doc.getTextWidth('Comercial:') + espacioEtiqueta, y);

  const xColumna2 = marginX + columnaWidth;
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', xColumna2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.cliente, xColumna2 + doc.getTextWidth('Cliente:') + espacioEtiqueta, y);

  const xColumna3 = marginX + (columnaWidth * 2);
  doc.setFont('helvetica', 'bold');
  doc.text('Ref. obra:', xColumna3, y);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.refObra, xColumna3 + doc.getTextWidth('Ref. obra:') + espacioEtiqueta, y);

  y += 5;

  // Recuadro azul simplificado
  const recuadroHeight = 25;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(marginX, y, contentWidth, recuadroHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.text('Información de la configuración', marginX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);

  let yDatos = y + 12;
  doc.text(`• Largo/salida: ${datos.salida} m · Ancho: ${datos.ancho} m · Altura libre: ${datos.altura} m`, marginX + 6, yDatos);
  yDatos += 5;
  doc.text(`• Módulos: ${datos.modulos} · Tipo de montaje: ${datos.tipoMontaje}`, marginX + 6, yDatos);

  y += recuadroHeight + 5;

  // ========== ESQUEMA SVG ==========
  const svgImagen = await convertirSVGaImagen(modalContent);
  
  if (svgImagen) {
    try {
      const img = new Image();
      img.src = svgImagen;
      
      await new Promise((resolve) => {
        img.onload = () => {
          const proporcion = img.width / img.height;
          let altoEnPDF = 70;
          let anchoEnPDF = altoEnPDF * proporcion;
          
          if (anchoEnPDF > contentWidth) {
            anchoEnPDF = contentWidth;
            altoEnPDF = anchoEnPDF / proporcion;
          }
          
          const xCentrado = marginX + (contentWidth - anchoEnPDF) / 2;
          doc.addImage(svgImagen, 'PNG', xCentrado, y, anchoEnPDF, altoEnPDF);
          y += altoEnPDF + 8;
          resolve();
        };
        img.onerror = () => {
          y += 5;
          resolve();
        };
      });
    } catch (e) {
      console.warn('⚠️ Error al añadir SVG:', e);
      y += 5;
    }
  }

  // Obtener datos del informe
  const informe = obtenerUltimoInforme();
  if (!informe || !informe.detalleHojaCorte) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('No hay datos de hoja de corte disponibles.', marginX, y);
    return;
  }

  // ========== HOJAS DE CORTE POR PERFIL ==========

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Hojas de corte por perfil', marginX, y);
  y += 6;

  informe.detalleHojaCorte.forEach((perfil, index) => {
    // Verificar espacio disponible
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    // Encabezado del perfil
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(marginX, y, contentWidth, 10, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(`${perfil.ref} - ${perfil.descripcion}`, marginX + 2, y + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Acabado: ${perfil.acabado} | Desperdicio total: ${(perfil.desperdicioTotal / 1000).toFixed(3)} m`, marginX + 2, y + 8);
    
    y += 12;

    // Agrupar barras por longitud
    const barrasPorLongitud = {};
    perfil.barrasDetalle.forEach(barra => {
      if (!barrasPorLongitud[barra.longitud]) {
        barrasPorLongitud[barra.longitud] = [];
      }
      barrasPorLongitud[barra.longitud].push(barra);
    });

    // Preparar datos para la tabla
    const datosBarras = Object.entries(barrasPorLongitud).map(([longitud, barras]) => {
      const piezasStr = barras[0].piezas.map(p => p.toFixed(0)).join(' + ');
      const desperdicioPromedio = barras.reduce((sum, b) => sum + b.desperdicio, 0) / barras.length;
      
      return [
        longitud,
        barras.length.toString(),
        piezasStr,
        desperdicioPromedio.toFixed(1)
      ];
    });

    // Tabla de barras
    doc.autoTable({
      startY: y,
      head: [['BARRA (mm)', 'CANTIDAD', 'PIEZAS CORTADAS (mm)', 'DESPERDICIO (mm)']],
      body: datosBarras,
      styles: {
        fontSize: 7,
        cellPadding: 1,
        lineColor: [229, 231, 235],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [31, 41, 55],
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 90, halign: 'left', fontSize: 6 },
        3: { cellWidth: 35, halign: 'center' }
      },
      margin: { left: marginX, right: marginX },
      tableWidth: contentWidth
    });

    y = doc.lastAutoTable.finalY + 8;
  });

  // ========== PIE DE PÁGINA ==========
  const numPaginas = doc.internal.pages.length - 1;
  for (let i = 1; i <= numPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Página ${i}`, marginX, 287);
    doc.setFont('helvetica', 'italic');
    doc.text('ALUMINIOS GALISUR · Pérgola Bioclimática Doha Sun', pageWidth - marginX, 287, { align: 'right' });
  }
}

// ============================================================================
// CONVERSIÓN SVG A IMAGEN
// ============================================================================

// Función auxiliar para formatear números con coma
function formatearNumeroConComa(numero) {
  if (typeof numero === 'string') {
    // Si ya es string, reemplazar punto por coma
    return numero.replace('.', ',');
  }
  if (typeof numero === 'number') {
    return numero.toFixed(2).replace('.', ',');
  }
  return numero;
}

async function convertirSVGaImagen(modalContent) {
  const svg = modalContent.querySelector('svg');
  if (!svg) {
    console.warn('⚠️ No se encontró SVG');
    return null;
  }

  try {
    // Crear canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Obtener proporción REAL del SVG (de su viewBox o atributos)
    const viewBox = svg.getAttribute('viewBox');
    let anchoOriginal, altoOriginal;
    
    if (viewBox) {
      const [, , w, h] = viewBox.split(' ').map(Number);
      anchoOriginal = w;
      altoOriginal = h;
    } else {
      // Si no hay viewBox, usar width/height del SVG
      anchoOriginal = parseFloat(svg.getAttribute('width')) || 800;
      altoOriginal = parseFloat(svg.getAttribute('height')) || 600;
    }
    
    // Calcular proporción
    const proporcion = anchoOriginal / altoOriginal;
    
    // ALTURA FIJA, ancho proporcional
    const altoFijo = 600;  // Altura fija en píxeles
    const anchoCalculado = Math.round(altoFijo * proporcion);
    
    canvas.width = anchoCalculado;
    canvas.height = altoFijo;

    // Clonar SVG y establecer dimensiones
    const svgClone = svg.cloneNode(true);
    svgClone.setAttribute('width', anchoCalculado);
    svgClone.setAttribute('height', altoFijo);
    
    // Si tiene viewBox, mantenerlo
    if (viewBox) {
      svgClone.setAttribute('viewBox', viewBox);
    }

    // Serializar SVG
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Cargar en imagen
    const img = new Image();
    const imagenBase64 = await new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, anchoCalculado, altoFijo);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar SVG'));
      };
      img.src = url;
    });

    console.log(`✅ SVG convertido: ${anchoCalculado}x${altoFijo}px (proporción ${proporcion.toFixed(2)}:1)`);
    return imagenBase64;
  } catch (error) {
    console.error('❌ Error al convertir SVG:', error);
    return null;
  }
}

// ============================================================================
// EXTRACCIÓN DE DATOS DEL HTML
// ============================================================================

function extraerDatosDelModal(modalContent) {
  const datos = {
    fecha: modalContent.querySelector('.pdf-fecha-header')?.textContent?.trim() || '',
    codigoPresupuesto: '',
    comercial: '—',
    cliente: '—',
    refObra: '—',
    salida: '',
    ancho: '',
    altura: '',
    modulos: '',
    tipoMontaje: '',
    numPilares: '',
    motores: '',
    numLamas: '',
    mando: ''
  };

  // Ref presupuesto
  const refElement = modalContent.querySelector('.pdf-ref-presupuesto');
  if (refElement) {
    const texto = refElement.textContent;
    datos.codigoPresupuesto = texto.replace('Ref. presupuesto:', '').trim();
  }

  // Datos comerciales
  const datosComerciales = modalContent.querySelectorAll('.pdf-datos-comerciales-ref div');
  if (datosComerciales.length >= 3) {
    datos.comercial = datosComerciales[0].textContent.replace('Comercial:', '').trim();
    datos.cliente = datosComerciales[1].textContent.replace('Cliente:', '').trim();
    datos.refObra = datosComerciales[2].textContent.replace('Ref. obra:', '').trim();
  }

  // Datos principales (dentro del recuadro azul)
  const listaDatos = modalContent.querySelectorAll('.pdf-lista-datos li');
  listaDatos.forEach(li => {
    const texto = li.textContent;
    
    if (texto.includes('Largo/salida:')) {
      const match = texto.match(/Largo\/salida:\s*([\d.]+)\s*m.*Ancho:\s*([\d.]+)\s*m.*Altura libre:\s*([\d.]+)\s*m/);
      if (match) {
        datos.salida = match[1];
        datos.ancho = match[2];
        datos.altura = match[3];
      }
    } else if (texto.includes('Módulos:')) {
      datos.modulos = texto.replace('Módulos:', '').trim();
    } else if (texto.includes('Tipo de montaje:')) {
      datos.tipoMontaje = texto.replace('Tipo de montaje:', '').trim();
    } else if (texto.includes('Nº pilares calculados:')) {
      datos.numPilares = texto.replace('Nº pilares calculados:', '').trim();
    } else if (texto.includes('Motores:')) {
      datos.motores = texto.replace('Motores:', '').trim();
    } else if (texto.includes('Número de lamas')) {
      // Flexible: funciona con "Número de lamas:" o "Número de lamas (tabla):"
      datos.numLamas = texto.replace(/Número de lamas\s*(\(tabla\))?:/i, '').trim();
    } else if (texto.includes('Mando:')) {
      datos.mando = texto.replace('Mando:', '').trim();
    }
  });

  // Extraer aviso amarillo si existe
  const avisoElement = modalContent.querySelector('.aviso-amarillo');
  let avisoTexto = (avisoElement && avisoElement.textContent) 
    ? avisoElement.textContent.trim() 
    : '';
  
  // Limpiar caracteres extraños que pueden venir del HTML
  if (avisoTexto) {
    avisoTexto = avisoTexto
      .replace(/[\u0080-\uFFFF]/g, '') // Eliminar TODOS los caracteres no-ASCII (incluye emoji)
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Quitar caracteres de control
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples
      .trim();
  }
  
  datos.avisoRefuerzo = avisoTexto;

  return datos;
}

function extraerMaterialesDelModal(modalContent) {
  const materiales = [];
  const filas = modalContent.querySelectorAll('.pdf-tabla-materiales tbody tr');

  filas.forEach(tr => {
    const celdas = tr.querySelectorAll('td');
    if (celdas.length >= 9) {
      materiales.push({
        tipo: celdas[0].textContent.trim(),
        ref: celdas[1].textContent.trim(),
        descripcion: celdas[2].textContent.trim(),
        acabado: celdas[3].textContent.trim(),
        refAcabado: celdas[4].textContent.trim(),
        longitudBarra: celdas[5].textContent.trim(),
        numBarras: celdas[6].textContent.trim(),
        precioUnit: celdas[7].textContent.trim(),
        importe: celdas[8].textContent.trim()
      });
    }
  });

  return materiales;
}

function extraerTotalesDelModal(modalContent) {
  const totales = {
    perfiles: '0,00 €',
    accesorios: '0,00 €',
    total: '0,00 €'
  };

  const filasTotales = modalContent.querySelectorAll('.pdf-total-fila');
  
  filasTotales.forEach(fila => {
    const texto = fila.textContent;
    const spans = fila.querySelectorAll('span');
    
    if (spans.length === 2) {
      const valor = spans[1].textContent.trim();
      
      if (texto.includes('Total perfiles')) {
        totales.perfiles = valor;
      } else if (texto.includes('Total accesorios')) {
        totales.accesorios = valor;
      } else if (texto.includes('Total materiales')) {
        totales.total = valor;
      }
    }
  });

  return totales;
}

// ============================================================================
// FUNCIONES DE GENERACIÓN HTML (SIN CAMBIOS - PARA VISTA PREVIA)
// ============================================================================

function generarDocumentoPaginado(tipo) {
  console.log('📄 Generando documento HTML:', tipo);

  const informe = obtenerUltimoInforme();
  if (!informe) {
    console.error('❌ No hay informe disponible');
    return null;
  }

  const totales = obtenerTotales();
  const datos = leerDatosContexto();

  if (tipo === 'material') {
    return generarPresupuestoPaginado(informe, totales, datos);
  } else if (tipo === 'corte') {
    return generarHojaCortePaginada(informe, datos);
  } else {
    return generarPesoPerimetrosPaginado(informe, totales, datos);
  }
}

function generarPresupuestoPaginado(informe, totales, datos) {
  if (!informe || !informe.detalleMaterial || informe.detalleMaterial.length === 0) {
    console.error('❌ No hay materiales en el informe');
    return null;
  }

  const materiales = informe.detalleMaterial;
  console.log('📊 Generando presupuesto HTML con', materiales.length, 'materiales');
  
  const htmlCompleto = `
    <div class="pdf-page-a4">
      ${generarCabecera(datos, 1, 'PRESUPUESTO PÉRGOLA BIOCLIMÁTICA · DOHA SUN')}
      
      <section class="pdf-content-a4">
        ${generarBloqueDatosPresupuesto(datos)}
        ${generarBloqueEsquema()}
        
        <div class="pdf-bloque-tabla">
          <h2 class="pdf-titulo-tabla-ref">Informe de material</h2>
          <div class="pdf-subtitulo-tabla-ref">• <strong>Acabado general:</strong> blanco</div>
          
          <table class="pdf-tabla-materiales">
            <thead>
              <tr>
                <th style="width: 8%;">TIPO</th>
                <th style="width: 8%;">REF.</th>
                <th style="width: 24%;">DESCRIPCIÓN</th>
                <th style="width: 12%;">ACABADO</th>
                <th style="width: 8%;">REF. ACABADO</th>
                <th style="width: 10%;">LONG. BARRA (m)</th>
                <th style="width: 10%;">Nº BARRAS / UDS</th>
                <th style="width: 10%;">PRECIO UNIT. (€)</th>
                <th style="width: 10%;">IMPORTE (€)</th>
              </tr>
            </thead>
            <tbody>
              ${generarFilasTabla(materiales)}
            </tbody>
          </table>
        </div>
        
        ${generarBloqueTotales(totales)}
      </section>
      
      ${generarPie(1)}
    </div>
  `;

  console.log('✅ HTML generado para vista previa');
  return `<div class="pdf-documento-multipagina">${htmlCompleto}</div>`;
}

function generarCabecera(datos, numPagina, titulo) {
  const tituloFinal = titulo || 'Presupuesto Pérgola Bioclimática · Doha Sun';
  
  const logoHTML = logoBase64 
    ? `<img src="${logoBase64}" class="pdf-logo-ref" alt="Logo Galisur" />`
    : '<div class="pdf-logo-ref-placeholder"></div>';

  const fechaFormateada = datos.fecha || '';

  return `
    <header class="pdf-header-ref">
      <div class="pdf-header-ref-top">
        <div class="pdf-header-ref-left">
          ${logoHTML}
        </div>
        <div class="pdf-header-ref-centro">
          <!-- Espacio central vacío -->
        </div>
        <div class="pdf-header-ref-right">
          <div style="font-weight: 700; font-size: 12pt; color: #0054a6; text-align: right; margin-bottom: 2mm;">
            ${tituloFinal}
          </div>
          <div class="pdf-fecha-header" style="font-size: 10pt; color: #4b5563; text-align: right;">
            ${fechaFormateada}
          </div>
        </div>
      </div>
      <div class="pdf-divider-ref"></div>
    </header>
  `;
}

function generarBloqueDatosPresupuesto(datos) {
  // Bloque de aviso si existe
  const bloqueAviso = datos.avisoRefuerzo ? `
    <div class="aviso-amarillo" style="margin-top: 0.75rem;">
      ${datos.avisoRefuerzo}
    </div>
  ` : '';
  
  return `
    <div class="pdf-resumen-config-ref">
      <div class="pdf-resumen-header-ref">
        <div>
          <h2 class="pdf-titulo-seccion-ref">Resumen de configuración</h2>
          <div class="pdf-ref-presupuesto">Ref. presupuesto: ${datos.codigoPresupuesto}</div>
        </div>
      </div>
      
      <div class="pdf-datos-comerciales-ref">
        <div><strong>Comercial:</strong> ${datos.comercial || '—'}</div>
        <div><strong>Cliente:</strong> ${datos.cliente || '—'}</div>
        <div><strong>Ref. obra:</strong> ${datos.refObra || '—'}</div>
      </div>
      
      <div class="pdf-recuadro-azul">
        <h3 class="pdf-recuadro-titulo">Datos principales</h3>
        <ul class="pdf-lista-datos">
          <li><strong>Largo/salida:</strong> ${datos.salida.toFixed(2)} m · <strong>Ancho:</strong> ${datos.ancho.toFixed(2)} m · <strong>Altura libre:</strong> ${datos.altura.toFixed(2)} m</li>
          <li><strong>Módulos:</strong> ${datos.modulos}</li>
          <li><strong>Tipo de montaje:</strong> ${datos.tipoMontajeTexto}</li>
          <li><strong>Nº pilares calculados:</strong> ${datos.numPilares}</li>
          <li><strong>Motores:</strong> ${datos.modoMotorTexto}</li>
          <li><strong>Número de lamas:</strong> ${datos.numLamas}</li>
          <li><strong>Mando:</strong> ${datos.mandoTexto}</li>
        </ul>
      </div>
      
      ${bloqueAviso}
    </div>
  `;
}

function generarBloqueEsquema() {
  let svgElement = null;
  
  const svgContainer = document.getElementById('svg-container');
  if (svgContainer && svgContainer.querySelector('svg')) {
    svgElement = svgContainer.querySelector('svg');
  }
  
  if (!svgElement) {
    const cards = document.querySelectorAll('.card');
    for (const card of cards) {
      const title = card.querySelector('.card-title');
      if (title && title.textContent.includes('Vista esquemática')) {
        svgElement = card.querySelector('svg');
        if (svgElement) break;
      }
    }
  }
  
  if (!svgElement) {
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      const rect = svg.getBoundingClientRect();
      if (rect.width > 400 && rect.height > 400) {
        svgElement = svg;
        break;
      }
    }
  }
  
  let svgContent = '';
  
  if (svgElement) {
    const svgClone = svgElement.cloneNode(true);
    svgClone.setAttribute('width', '160mm');
    svgClone.setAttribute('height', 'auto');
    svgClone.style.display = 'block';
    svgClone.style.maxWidth = '100%';
    
    svgContent = svgClone.outerHTML;
    console.log('✅ SVG encontrado para vista previa');
  } else {
    svgContent = '<div class="pdf-esquema-placeholder">Esquema no disponible</div>';
    console.warn('⚠️ SVG no encontrado');
  }

  return `
    <div class="pdf-bloque-esquema-ref">
      <div class="pdf-esquema-contenedor-ref">
        ${svgContent}
      </div>
    </div>
  `;
}

function generarFilasTabla(filas) {
  return filas.map(item => `
    <tr>
      <td>${item.tipo || 'Perfil'}</td>
      <td>${item.ref || '—'}</td>
      <td>${item.descripcion || '—'}</td>
      <td>${item.acabado || 'Blanco'}</td>
      <td>${item.refAcabado || 'SIN ESPECIFICAR'}</td>
      <td style="text-align: right;">${item.longitudBarra || '—'}</td>
      <td style="text-align: right;">${item.numBarras || '—'}</td>
      <td style="text-align: right;">${item.precioUnitario || '0,00 €'}</td>
      <td style="text-align: right;">${item.importe !== undefined ? precioFormatearEuro(item.importe) : '0,00 €'}</td>
    </tr>
  `).join('');
}

function generarBloqueTotales(totales) {
  if (!totales) return '';

  return `
    <div class="pdf-bloque-totales">
      <h3 class="pdf-totales-titulo">Resumen económico</h3>
      <div class="pdf-total-fila">
        <span>Total perfiles</span>
        <span>${precioFormatearEuro(totales.subtotalAluminio || 0)}</span>
      </div>
      <div class="pdf-total-fila">
        <span>Total accesorios</span>
        <span>${precioFormatearEuro(totales.subtotalAccesorios || 0)}</span>
      </div>
      <div class="pdf-total-fila pdf-total-destacado">
        <span>Total materiales</span>
        <span>${precioFormatearEuro(totales.totalGeneral || 0)}</span>
      </div>
    </div>
  `;
}

function generarPie(numPagina) {
  return `
    <footer class="pdf-footer-a4">
      <span class="pdf-footer-izq">Página ${numPagina}</span>
      <span class="pdf-footer-der">ALUMINIOS GALISUR · Pérgola Bioclimática Doha Sun</span>
    </footer>
  `;
}

// Funciones simplificadas para otros documentos
function generarHojaCortePaginada(informe, datos) {
  if (!informe || !informe.detalleHojaCorte) {
    return `
      <div class="pdf-documento-multipagina">
        <div class="pdf-page-a4">
          ${generarCabecera(datos, 1, 'HOJA DE CORTE PÉRGOLA BIOCLIMÁTICA · DOHA SUN')}
          <section class="pdf-content-a4">
            <p style="text-align: center; color: #666; margin-top: 3rem;">No hay datos de hoja de corte disponibles.</p>
          </section>
          ${generarPie(1)}
        </div>
      </div>
    `;
  }

  const bloqueDatos = `
    <div class="pdf-resumen-config-ref">
      <div class="pdf-resumen-header-ref">
        <div>
          <h2 class="pdf-titulo-seccion-ref">Resumen de configuración</h2>
          <div class="pdf-ref-presupuesto">Ref. presupuesto: ${datos.codigoPresupuesto}</div>
        </div>
      </div>
      
      <div class="pdf-datos-comerciales-ref">
        <div><strong>Comercial:</strong> ${datos.comercial || '—'}</div>
        <div><strong>Cliente:</strong> ${datos.cliente || '—'}</div>
        <div><strong>Ref. obra:</strong> ${datos.refObra || '—'}</div>
      </div>
      
      <div class="pdf-recuadro-azul">
        <h3 class="pdf-recuadro-titulo">Información de la configuración</h3>
        <ul class="pdf-lista-datos">
          <li><strong>Largo/salida:</strong> ${datos.salida.toFixed(2)} m · <strong>Ancho:</strong> ${datos.ancho.toFixed(2)} m · <strong>Altura libre:</strong> ${datos.altura.toFixed(2)} m</li>
          <li><strong>Módulos:</strong> ${datos.modulos} · <strong>Tipo de montaje:</strong> ${datos.tipoMontajeTexto}</li>
        </ul>
      </div>
    </div>
  `;

  const bloqueEsquema = generarBloqueEsquema();

  const bloquesPerfiles = informe.detalleHojaCorte.map(perfil => {
    // Agrupar barras por longitud
    const barrasPorLongitud = {};
    perfil.barrasDetalle.forEach(barra => {
      if (!barrasPorLongitud[barra.longitud]) {
        barrasPorLongitud[barra.longitud] = [];
      }
      barrasPorLongitud[barra.longitud].push(barra);
    });

    const filasBarras = Object.entries(barrasPorLongitud).map(([longitud, barras], index) => {
      const piezasStr = barras[0].piezas.map(p => p.toFixed(0)).join(' + ');
      const desperdicioPromedio = barras.reduce((sum, b) => sum + b.desperdicio, 0) / barras.length;
      
      return `
        <tr class="${index % 2 === 0 ? 'pdf-fila-par' : ''}">
          <td style="font-weight: 600; font-family: monospace; text-align: center;">${longitud}</td>
          <td style="text-align: center; font-weight: 600;">${barras.length}</td>
          <td style="font-family: monospace; font-size: 0.8rem;">${piezasStr}</td>
          <td style="text-align: center; font-family: monospace;">${desperdicioPromedio.toFixed(1)}</td>
        </tr>
      `;
    }).join('');

    return `
      <div style="margin-bottom: 2rem; page-break-inside: avoid;">
        <div style="margin-bottom: 1rem; padding: 0.75rem; background-color: var(--blue-soft); border-radius: 0.5rem; border-left: 4px solid var(--blue-main);">
          <div style="font-weight: 700; font-size: 1.05rem; color: var(--blue-dark); margin-bottom: 0.25rem;">
            ${perfil.ref} - ${perfil.descripcion}
          </div>
          <div style="font-size: 0.9rem; color: var(--text-soft);">
            Acabado: ${perfil.acabado} | Desperdicio total: ${(perfil.desperdicioTotal / 1000).toFixed(3)} m
          </div>
        </div>
        <table class="pdf-tabla-materiales" style="width: 100%; font-size: 0.9rem;">
          <thead>
            <tr>
              <th style="width: 15%;">BARRA (mm)</th>
              <th style="width: 10%;">CANTIDAD</th>
              <th style="width: 55%;">PIEZAS CORTADAS (mm)</th>
              <th style="width: 20%;">DESPERDICIO (mm)</th>
            </tr>
          </thead>
          <tbody>
            ${filasBarras}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  const htmlCompleto = `
    <div class="pdf-page-a4">
      ${generarCabecera(datos, 1, 'HOJA DE CORTE PÉRGOLA BIOCLIMÁTICA · DOHA SUN')}
      
      <section class="pdf-content-a4">
        ${bloqueDatos}
        ${bloqueEsquema}
        
        <div class="pdf-bloque-tabla">
          <h2 class="pdf-titulo-tabla-ref">Hojas de corte por perfil</h2>
          ${bloquesPerfiles}
        </div>
      </section>
      
      ${generarPie(1)}
    </div>
  `;

  return `<div class="pdf-documento-multipagina">${htmlCompleto}</div>`;
}

function generarPesoPerimetrosPaginado(informe, totales, datos) {
  if (!informe || !informe.detallePesoPerimetro) {
    return `
      <div class="pdf-documento-multipagina">
        <div class="pdf-page-a4">
          ${generarCabecera(datos, 1, 'PESOS Y PERÍMETROS PÉRGOLA BIOCLIMÁTICA · DOHA SUN')}
          <section class="pdf-content-a4">
            <p style="text-align: center; color: #666; margin-top: 3rem;">No hay datos de pesos y perímetros disponibles.</p>
          </section>
          ${generarPie(1)}
        </div>
      </div>
    `;
  }

  const filasPeso = informe.detallePesoPerimetro.map((item, index) => `
    <tr class="${index % 2 === 0 ? 'pdf-fila-par' : ''}">
      <td style="font-family: monospace; text-align: center;">${item.ref}</td>
      <td>${item.descripcion}</td>
      <td style="text-align: center; font-weight: 600;">${item.pesoTotal.toFixed(2)} kg</td>
      <td style="text-align: center; font-weight: 600;">${item.perimetroTotal.toFixed(2)} mm</td>
    </tr>
  `).join('');

  const bloqueDatos = `
    <div class="pdf-resumen-config-ref">
      <div class="pdf-resumen-header-ref">
        <div>
          <h2 class="pdf-titulo-seccion-ref">Resumen de configuración</h2>
          <div class="pdf-ref-presupuesto">Ref. presupuesto: ${datos.codigoPresupuesto}</div>
        </div>
      </div>
      
      <div class="pdf-datos-comerciales-ref">
        <div><strong>Comercial:</strong> ${datos.comercial || '—'}</div>
        <div><strong>Cliente:</strong> ${datos.cliente || '—'}</div>
        <div><strong>Ref. obra:</strong> ${datos.refObra || '—'}</div>
      </div>
      
      <div class="pdf-recuadro-azul">
        <h3 class="pdf-recuadro-titulo">Información de la configuración</h3>
        <ul class="pdf-lista-datos">
          <li><strong>Largo/salida:</strong> ${datos.salida.toFixed(2)} m · <strong>Ancho:</strong> ${datos.ancho.toFixed(2)} m · <strong>Altura libre:</strong> ${datos.altura.toFixed(2)} m</li>
          <li><strong>Módulos:</strong> ${datos.modulos} · <strong>Tipo de montaje:</strong> ${datos.tipoMontajeTexto}</li>
        </ul>
      </div>
    </div>
  `;

  const htmlCompleto = `
    <div class="pdf-page-a4">
      ${generarCabecera(datos, 1, 'PESOS Y PERÍMETROS PÉRGOLA BIOCLIMÁTICA · DOHA SUN')}
      
      <section class="pdf-content-a4">
        ${bloqueDatos}
        
        <div class="pdf-bloque-tabla">
          <h2 class="pdf-titulo-tabla-ref">Pesos y perímetros por perfil</h2>
          
          <table class="pdf-tabla-materiales">
            <thead>
              <tr>
                <th style="width: 15%;">REFERENCIA</th>
                <th style="width: 50%;">DESCRIPCIÓN</th>
                <th style="width: 17%;">PESO TOTAL (kg)</th>
                <th style="width: 18%;">PERÍMETRO (mm)</th>
              </tr>
            </thead>
            <tbody>
              ${filasPeso}
              <tr style="border-top: 2px solid var(--border); font-weight: 700; background-color: var(--blue-soft);">
                <td colspan="2" style="text-align: right; padding-right: 1rem; color: var(--blue-dark);">TOTALES:</td>
                <td style="text-align: center; color: var(--blue-dark);">${informe.totales.pesoTotal.toFixed(2)} kg</td>
                <td style="text-align: center; color: var(--blue-dark);">${informe.totales.perimetroTotal.toFixed(2)} mm</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      
      ${generarPie(1)}
    </div>
  `;

  return `<div class="pdf-documento-multipagina">${htmlCompleto}</div>`;
}

// ============================================================================
// UTILIDADES
// ============================================================================

function leerDatosContexto() {
  // Datos de cabecera
  const comercial = document.getElementById('comercial')?.value || '';
  const cliente = document.getElementById('cliente')?.value || '';
  const refObra = document.getElementById('refObra')?.value || '';
  
  // Dimensiones
  const ancho = parseFloat(document.getElementById('ancho')?.value) || 0;
  const salida = parseFloat(document.getElementById('salida')?.value) || 0;
  const altura = parseFloat(document.getElementById('altura')?.value) || 0;
  
  // Módulos
  const chkVarios = document.getElementById('chkVariosModulos');
  const variosModulos = chkVarios?.checked || false;
  const modulos = variosModulos ? parseInt(document.getElementById('modulos')?.value, 10) || 1 : 1;
  
  // Tipo de montaje
  const tipoMontajeSelect = document.querySelector('input[name="montaje"]:checked');
  const tipoMontajeValue = tipoMontajeSelect?.value || 'pilares';
  const tipoMontajeTexto = DESCRIPCIONES_MONT[tipoMontajeValue] || tipoMontajeValue;
  
  // Número de pilares (leer del display)
  const numPilaresText = document.getElementById('pilaresDisplay')?.textContent || '0';
  const numPilares = parseInt(numPilaresText, 10) || 0;
  
  // Motores
  const modoMotor = document.querySelector('input[name="modoMotor"]:checked')?.value || 'todos-izquierda';
  let modoMotorTexto = '';
  if (modoMotor === 'todos-izquierda') {
    modoMotorTexto = 'Configuración: todos a izquierda';
  } else if (modoMotor === 'todos-derecha') {
    modoMotorTexto = 'Configuración: todos a derecha';
  } else {
    modoMotorTexto = 'Personalizado';
  }
  
  // Número de lamas (calcular desde salida)
  const numLamas = calcularNumeroLamas(salida) || 0;
  
  // Mando
  const mandoValue = document.getElementById('mando')?.value || 'con';
  const mandoTexto = mandoValue === 'con' ? 'Con mando (1 ud. por instalación).' : 'Sin mando incluido (se definirá aparte).';
  
  // Referencia de presupuesto - intentar ambos elementos
  let codigoPresupuesto = document.getElementById('refCodeInline')?.textContent?.trim();
  if (!codigoPresupuesto) {
    codigoPresupuesto = document.getElementById('refCode')?.textContent?.trim();
  }
  if (!codigoPresupuesto) {
    codigoPresupuesto = generarCodigoRef();
  }
  
  // Fecha
  const fecha = generarFechaFormateada();
  
  // Avisos
  const avisoRefuerzo = document.getElementById('avisoRefuerzo');
  let textoAviso = (avisoRefuerzo && avisoRefuerzo.style.display !== 'none') 
    ? avisoRefuerzo.textContent.trim() 
    : '';
  
  // Limpiar caracteres extraños
  if (textoAviso) {
    textoAviso = textoAviso
      .replace(/^[&þ\s]+/, '') // Quitar caracteres raros al inicio
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Quitar caracteres de control
      .trim();
  }

  return {
    comercial, cliente, refObra,
    ancho, salida, altura, modulos,
    tipoMontajeTexto, numPilares,
    modoMotorTexto, numLamas, mandoTexto,
    codigoPresupuesto, fecha,
    avisoRefuerzo: textoAviso
  };
}

function obtenerTipoDocumento() {
  const selector = document.getElementById('selectorDocumento');
  return selector ? selector.value : 'material';
}

function generarNombreArchivo(tipo) {
  // Intentar obtener la referencia desde varios elementos posibles
  let codigo = document.getElementById('refCodeInline')?.textContent?.trim();
  if (!codigo) {
    codigo = document.getElementById('refCode')?.textContent?.trim();
  }
  if (!codigo) {
    codigo = generarTimestamp();
  }

  let nombreDocumento = 'Informe de Material';
  if (tipo === 'corte') nombreDocumento = 'Hoja de Corte';
  if (tipo === 'peso') nombreDocumento = 'Peso y Perímetros';

  return `${codigo} - ${nombreDocumento}.pdf`;
}

function generarTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export function compartirWhatsApp() {
  alert('Función de compartir WhatsApp - En desarrollo');
}

function habilitarGestosVistaPrevia() {
  const modalBody = document.querySelector('.pdf-modal-body');
  const preview = document.getElementById('pdfPreviewContent');
  if (!modalBody || !preview) return;

  deshabilitarGestosVistaPrevia();

  const state = {
    scale: 1,
    minScale: 0.5,
    maxScale: 3,
    translateX: 0,
    translateY: 0,
    pointers: new Map(),
    startDistance: 0,
    startScale: 1,
    startTranslateX: 0,
    startTranslateY: 0,
    startMidpoint: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
    controller: new AbortController()
  };

  const applyTransform = () => {
    preview.style.transformOrigin = '0 0';
    preview.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
  };

  const getMidpoint = (p1, p2) => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  });

  const clampScale = value => Math.min(state.maxScale, Math.max(state.minScale, value));

  const onPointerDown = event => {
    preview.setPointerCapture(event.pointerId);
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (state.pointers.size === 1) {
      state.startPan = { x: event.clientX, y: event.clientY };
      state.startTranslateX = state.translateX;
      state.startTranslateY = state.translateY;
    }

    if (state.pointers.size === 2) {
      const [p1, p2] = Array.from(state.pointers.values());
      state.startDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      state.startScale = state.scale;
      state.startTranslateX = state.translateX;
      state.startTranslateY = state.translateY;
      state.startMidpoint = getMidpoint(p1, p2);
    }
  };

  const onPointerMove = event => {
    if (!state.pointers.has(event.pointerId)) return;
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (state.pointers.size === 2) {
      const [p1, p2] = Array.from(state.pointers.values());
      const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (!state.startDistance) return;
      const nextScale = clampScale(state.startScale * (distance / state.startDistance));
      const midpoint = getMidpoint(p1, p2);
      const deltaX = midpoint.x - state.startMidpoint.x;
      const deltaY = midpoint.y - state.startMidpoint.y;

      state.scale = nextScale;
      state.translateX = state.startTranslateX + deltaX;
      state.translateY = state.startTranslateY + deltaY;
      applyTransform();
      return;
    }

    if (state.pointers.size === 1) {
      const deltaX = event.clientX - state.startPan.x;
      const deltaY = event.clientY - state.startPan.y;
      state.translateX = state.startTranslateX + deltaX;
      state.translateY = state.startTranslateY + deltaY;
      applyTransform();
    }
  };

  const onPointerUp = event => {
    if (state.pointers.has(event.pointerId)) {
      state.pointers.delete(event.pointerId);
    }
    if (state.pointers.size < 2) {
      state.startDistance = 0;
    }
  };

  const onWheel = event => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const delta = -event.deltaY;
    const zoomFactor = delta > 0 ? 1.05 : 0.95;
    const nextScale = clampScale(state.scale * zoomFactor);
    state.scale = nextScale;
    applyTransform();
  };

  preview.style.touchAction = 'none';
  preview.style.transformOrigin = '0 0';
  preview.style.transform = 'translate(0, 0) scale(1)';
  modalBody.style.overflow = 'hidden';

  preview.addEventListener('pointerdown', onPointerDown, { signal: state.controller.signal });
  preview.addEventListener('pointermove', onPointerMove, { signal: state.controller.signal });
  preview.addEventListener('pointerup', onPointerUp, { signal: state.controller.signal });
  preview.addEventListener('pointercancel', onPointerUp, { signal: state.controller.signal });
  preview.addEventListener('wheel', onWheel, { signal: state.controller.signal, passive: false });

  vistaPreviaGestos = { controller: state.controller, preview, modalBody };
}

function deshabilitarGestosVistaPrevia() {
  if (!vistaPreviaGestos) return;
  const { controller, preview, modalBody } = vistaPreviaGestos;
  controller.abort();
  if (preview) {
    preview.style.transform = '';
    preview.style.transformOrigin = '';
    preview.style.touchAction = '';
  }
  if (modalBody) modalBody.style.overflow = '';
  vistaPreviaGestos = null;
}
