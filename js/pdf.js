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
    console.log('✅ Modal abierto con vista previa HTML');
  }
}

export function cerrarModal() {
  const modal = document.getElementById('pdfPreviewModal');
  if (modal) {
    modal.style.display = 'none';
    modalAbierto = false;
  }
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
    
    const materiales = extraerMaterialesDelModal(modalContent);
    const totales = extraerTotalesDelModal(modalContent);
    
    // Convertir SVG a imagen
    const svgImagen = await convertirSVGaImagen(modalContent);

    // Generar PDF
    await generarPDFconJsPDF(doc, datos, materiales, totales, svgImagen);

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
  doc.setTextColor(0, 84, 166); // Azul corporativo GALISUR
  doc.text('Presupuesto Pérgola Bioclimática · Doha Sun', pageWidth - marginX, y + 8, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99); // Gris oscuro para mejor legibilidad
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

  // CORRECCIÓN: Ref. presupuesto con espacio después de los dos puntos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('Ref. presupuesto: ', marginX, y);
  
  doc.setFont('helvetica', 'normal');
  const refWidth = doc.getTextWidth('Ref. presupuesto: ');
  doc.text(datos.codigoPresupuesto, marginX + refWidth, y);
  y += 8;

  // CORRECCIÓN: Datos comerciales con mejor espaciado (7mm entre líneas)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  
  // Comercial
  doc.setFont('helvetica', 'bold');
  doc.text('Comercial: ', marginX, y);
  doc.setFont('helvetica', 'normal');
  const comercialLabelWidth = doc.getTextWidth('Comercial: ');
  const comercialText = doc.splitTextToSize(datos.comercial, contentWidth - comercialLabelWidth - 10);
  doc.text(comercialText, marginX + comercialLabelWidth, y);
  y += 7; // AUMENTADO de 5 a 7
  
  // Cliente
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente: ', marginX, y);
  doc.setFont('helvetica', 'normal');
  const clienteLabelWidth = doc.getTextWidth('Cliente: ');
  const clienteText = doc.splitTextToSize(datos.cliente, contentWidth - clienteLabelWidth - 10);
  doc.text(clienteText, marginX + clienteLabelWidth, y);
  y += 7; // AUMENTADO de 5 a 7
  
  // Ref. obra
  doc.setFont('helvetica', 'bold');
  doc.text('Ref. obra: ', marginX, y);
  doc.setFont('helvetica', 'normal');
  const refObraLabelWidth = doc.getTextWidth('Ref. obra: ');
  const refObraText = doc.splitTextToSize(datos.refObra, contentWidth - refObraLabelWidth - 10);
  doc.text(refObraText, marginX + refObraLabelWidth, y);
  
  y += 10; // Espacio antes del aviso
  
  // CORRECCIÓN: Bloque de aviso con altura dinámica y mejor control de desbordamiento
  if (datos.avisoRefuerzo && datos.avisoRefuerzo.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Calcular líneas necesarias con margen interno adecuado
    const margenInternoAviso = 6;
    const textoAviso = doc.splitTextToSize(datos.avisoRefuerzo, contentWidth - margenInternoAviso);
    const numLineas = textoAviso.length;
    const alturaLinea = 4;
    const avisoHeight = Math.max(12, (numLineas * alturaLinea) + 6); // Mínimo 12mm, dinámico según texto
    
    // Dibujar recuadro amarillo
    doc.setFillColor(254, 249, 195); // Fondo amarillo claro
    doc.setDrawColor(252, 211, 77); // Borde amarillo
    doc.roundedRect(marginX, y, contentWidth, avisoHeight, 2, 2, 'FD');
    
    doc.setTextColor(146, 64, 14); // Texto marrón
    
    // Renderizar texto línea por línea
    let yTextoAviso = y + 5;
    textoAviso.forEach(linea => {
      doc.text(linea, marginX + 3, yTextoAviso);
      yTextoAviso += alturaLinea;
    });
    
    y += avisoHeight + 5;
  }

  // Recuadro azul con datos principales
  const recuadroHeight = 45;
  doc.setFillColor(239, 246, 255); // Azul muy claro
  doc.setDrawColor(191, 219, 254); // Borde azul
  doc.roundedRect(marginX, y, contentWidth, recuadroHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.text('Datos principales', marginX + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  
  let yDatos = y + 12;
  
  // Función auxiliar para renderizar línea con enunciado en negrita
  const renderLineaNegrita = (texto) => {
    // Dividir por los dos puntos para separar enunciado de valor
    const partes = texto.split(':');
    if (partes.length > 1) {
      // Renderizar enunciados en negrita
      let xActual = marginX + 6;
      doc.text('• ', xActual, yDatos);
      xActual += doc.getTextWidth('• ');
      
      // Recorrer cada parte del texto
      const fragmentos = texto.substring(2).split(/(\b(?:Largo\/salida|Ancho|Altura libre|Módulos|Tipo de montaje|Nº pilares calculados|Motores|Número de lamas|Mando):\s*)/g);
      
      fragmentos.forEach((frag, idx) => {
        if (frag.match(/\b(?:Largo\/salida|Ancho|Altura libre|Módulos|Tipo de montaje|Nº pilares calculados|Motores|Número de lamas|Mando):\s*/)) {
          doc.setFont('helvetica', 'bold');
          doc.text(frag, xActual, yDatos);
          xActual += doc.getTextWidth(frag);
        } else if (frag.trim()) {
          doc.setFont('helvetica', 'normal');
          doc.text(frag, xActual, yDatos);
          xActual += doc.getTextWidth(frag);
        }
      });
    } else {
      doc.text(texto, marginX + 6, yDatos);
    }
    yDatos += 5;
  };
  
  const datosTexto = [
    `• Largo/salida: ${datos.salida} m · Ancho: ${datos.ancho} m · Altura libre: ${datos.altura} m`,
    `• Módulos: ${datos.modulos}`,
    `• Tipo de montaje: ${datos.tipoMontaje}`,
    `• Nº pilares calculados: ${datos.numPilares}`,
    `• Motores: ${datos.motores}`,
    `• Número de lamas: ${datos.numLamas}`,
    `• Mando: ${datos.mando}`
  ];

  datosTexto.forEach(texto => {
    renderLineaNegrita(texto);
  });

  y += recuadroHeight + 8;

  // ========== SVG ESQUEMA ==========
  
  if (svgImagen) {
    try {
      // Calcular dimensiones manteniendo aspect ratio
      const maxWidth = contentWidth;
      const maxHeight = 60;
      
      const img = new Image();
      img.src = svgImagen;
      
      await new Promise((resolve) => {
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const ratio = width / height;
          
          if (width > maxWidth) {
            width = maxWidth;
            height = width / ratio;
          }
          
          if (height > maxHeight) {
            height = maxHeight;
            width = height * ratio;
          }
          
          const xCentrado = marginX + (contentWidth - width) / 2;
          doc.addImage(svgImagen, 'PNG', xCentrado, y, width, height);
          resolve();
        };
        img.onerror = resolve;
      });
      
      y += 65;
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

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('• Acabado general: blanco', marginX, y);
  y += 2;

  // Tabla con autotable - headers con unidades
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
      // IMPORTANTE: Usar longitudBarra tal cual viene del informe (sin manipular)
      // para mantener consistencia con web y vista previa
      const longBarra = m.longitudBarra || '—';
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
      fontSize: 8,
      cellPadding: 1.5,
      lineColor: [229, 231, 235],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [31, 41, 55],
      fontStyle: 'bold',
      lineColor: [209, 213, 219],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    columnStyles: {
      5: { halign: 'right' }, // Long. barra
      6: { halign: 'right' }, // Nº barras
      7: { halign: 'right' }, // Precio unit.
      8: { halign: 'right' }  // Importe
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // ========== TOTALES (ANCHO COMPLETO) ==========
  
  // Verificar si hay espacio, si no añadir página
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Usar todo el ancho disponible (contentWidth)
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

    // Obtener dimensiones del SVG
    const svgRect = svg.getBoundingClientRect();
    const scale = 2; // Para mejor calidad
    canvas.width = svgRect.width * scale;
    canvas.height = svgRect.height * scale;

    // Serializar SVG
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Cargar en imagen
    const img = new Image();
    const imagenBase64 = await new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar SVG'));
      };
      img.src = url;
    });

    console.log('✅ SVG convertido a imagen');
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
      datos.numLamas = texto.replace(/Número de lamas\s*\(tabla\)?:/g, '').trim();
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
      .replace(/^[&þ\s]+/, '') // Quitar caracteres raros al inicio
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Quitar caracteres de control
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
            Presupuesto Pérgola Bioclimática · Doha Sun
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
    <div class="aviso-amarillo" style="margin-bottom: 0.75rem;">
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
        <div><strong>Comercial: </strong>${datos.comercial || '—'}</div>
        <div><strong>Cliente: </strong>${datos.cliente || '—'}</div>
        <div><strong>Ref. obra: </strong>${datos.refObra || '—'}</div>
      </div>
      
      ${bloqueAviso}
      
      <div class="pdf-recuadro-azul">
        <h3 class="pdf-recuadro-titulo">Datos principales</h3>
        <ul class="pdf-lista-datos">
          <li><strong>Largo/salida:</strong> ${datos.salida.toFixed(2)} m · <strong>Ancho:</strong> ${datos.ancho.toFixed(2)} m · <strong>Altura libre:</strong> ${datos.altura.toFixed(2)} m</li>
          <li><strong>Módulos:</strong> ${datos.modulos}</li>
          <li><strong>Tipo de montaje:</strong> ${datos.tipoMontajeTexto}</li>
          <li><strong>Nº pilares calculados:</strong> ${datos.numPilares}</li>
          <li><strong>Motores:</strong> ${datos.modoMotorTexto}</li>
          <li><strong>Número de lamas (tabla):</strong> ${datos.numLamas}</li>
          <li><strong>Mando:</strong> ${datos.mandoTexto}</li>
        </ul>
      </div>
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
  return `<div class="pdf-documento-multipagina"><div class="pdf-page-a4"><p>Hoja de corte - En desarrollo</p></div></div>`;
}

function generarPesoPerimetrosPaginado(informe, totales, datos) {
  return `<div class="pdf-documento-multipagina"><div class="pdf-page-a4"><p>Peso y perímetros - En desarrollo</p></div></div>`;
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
      .replace(/^[\u26A0\u26A1\u26D4\uFE0F&þ\s]+/, '') // Quitar símbolos de advertencia y caracteres raros al inicio
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Quitar caracteres de control
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples a uno solo
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
