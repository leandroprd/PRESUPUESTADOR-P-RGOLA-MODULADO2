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
  console.log('📥 Generando PDF desde vista previa HTML...');

  if (typeof window.jspdf === 'undefined') {
    alert('Error: Librería jsPDF no encontrada.');
    return;
  }

  if (typeof html2canvas === 'undefined') {
    alert('Error: Librería html2canvas no encontrada.');
    return;
  }

  // VALIDACIONES: Verificar que comercial, cliente y ref obra están rellenos
  const comercialInput = document.getElementById('comercial');
  const clienteInput = document.getElementById('cliente');
  const refObraInput = document.getElementById('refObra');
  
  const comercial = comercialInput?.value?.trim();
  const cliente = clienteInput?.value?.trim();
  const refObra = refObraInput?.value?.trim();
  
  if (!comercial || comercial === '') {
    alert('⚠️ ATENCIÓN: Debes rellenar el campo "Comercial" antes de generar el documento.');
    return;
  }
  
  if (!cliente || cliente === '') {
    alert('⚠️ ATENCIÓN: Debes rellenar el campo "Cliente" antes de generar el documento.');
    return;
  }
  
  if (!refObra || refObra === '') {
    alert('⚠️ ATENCIÓN: Debes rellenar el campo "Ref. obra" antes de generar el documento.');
    return;
  }

  const modalContent = document.getElementById('pdfPreviewContent');
  if (!modalContent) {
    alert('Error: No se encuentra el contenido de la vista previa.');
    return;
  }

  try {
    console.log('📸 Capturando HTML con html2canvas...');
    
    // Capturar el HTML completo de la vista previa
    const canvas = await html2canvas(modalContent, {
      scale: 2, // Mayor calidad
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    console.log('✅ HTML capturado, generando PDF...');

    const { jsPDF } = window.jspdf;
    
    // Dimensiones A4 en mm
    const pdfWidth = 210;
    const pdfHeight = 297;
    
    // Calcular dimensiones de la imagen
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Crear PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Si la imagen es más alta que una página, dividir en varias páginas
    let heightLeft = imgHeight;
    let position = 0;
    
    // Convertir canvas a imagen
    const imgData = canvas.toDataURL('image/png');
    
    // Añadir primera página
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
    
    // Añadir páginas adicionales si es necesario
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Descargar
    const nombreArchivo = generarNombreArchivo(tipoDocumentoActual);
    pdf.save(nombreArchivo);
    
    console.log('✅ PDF generado correctamente desde vista previa');
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    alert('Error al generar el PDF. Ver consola para detalles.');
  }
}

// ============================================================================
// FUNCIONES OBSOLETAS (NO SE USAN - SE MANTIENEN POR REFERENCIA)
// ============================================================================
// NOTA: Estas funciones construían el PDF manualmente línea por línea.
// Ahora el PDF se genera capturando el HTML de vista previa con html2canvas.
// Se mantienen comentadas por si se necesitan como referencia.
// ============================================================================

/*
async function generarPDFconJsPDF(doc, datos, materiales, totales, svgImagen) {
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

  // Título (derecha, negrita, destacado)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55); // Gris oscuro
  doc.text('Presupuesto Pérgola Bioclimática · Doha Sun', pageWidth - marginX, y + 8, { align: 'right' });

  // Fecha (derecha, debajo del título)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Gris
  doc.text(datos.fecha, pageWidth - marginX, y + 14, { align: 'right' });

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

  // Datos comerciales
  doc.setTextColor(55, 65, 81);
  const datosComerciales = `Comercial: ${datos.comercial}    Cliente: ${datos.cliente}    Ref. obra: ${datos.refObra}`;
  doc.text(datosComerciales, marginX, y);
  y += 8;

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
  const datosTexto = [
    `• Largo/salida: ${datos.salida.toFixed(2)} m · Ancho: ${datos.ancho.toFixed(2)} m · Altura libre: ${datos.altura.toFixed(2)} m`,
    `• Módulos: ${datos.modulos}`,
    `• Tipo de montaje: ${datos.tipoMontajeTexto}`,
    `• Nº pilares calculados: ${datos.numPilares}`,
    `• Motores: ${datos.modoMotorTexto}`,
    `• Número de lamas (tabla): ${datos.numLamas}`,
    `• Mando: ${datos.mandoTexto}`
  ];

  datosTexto.forEach(texto => {
    doc.text(texto, marginX + 6, yDatos);
    yDatos += 5;
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
      return [
        m.tipo,
        m.ref,
        m.descripcion,
        m.acabado,
        m.refAcabado || 'SIN ESPECIFICAR',
        m.longitudBarra,
        m.numBarras,
        m.precioUnitario,
        typeof m.importe === 'number' ? m.importe.toFixed(2).replace('.', ',') : m.importe
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

  // ========== TOTALES ==========
  
  // Verificar si hay espacio, si no añadir página
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  const totalesWidth = 80;
  const totalesX = pageWidth - marginX - totalesWidth;

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
  doc.text(precioFormatearEuro(totales.subtotalAluminio), totalesX + totalesWidth - 4, yTotal, { align: 'right' });

  yTotal += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Total accesorios', totalesX + 4, yTotal);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(precioFormatearEuro(totales.subtotalAccesorios), totalesX + totalesWidth - 4, yTotal, { align: 'right' });

  yTotal += 7;
  doc.setDrawColor(3, 105, 161);
  doc.line(totalesX + 4, yTotal - 2, totalesX + totalesWidth - 4, yTotal - 2);
  doc.line(totalesX + 4, yTotal + 4, totalesX + totalesWidth - 4, yTotal + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(3, 105, 161);
  doc.text('Total materiales', totalesX + 4, yTotal + 2);
  doc.text(precioFormatearEuro(totales.totalGeneral), totalesX + totalesWidth - 4, yTotal + 2, { align: 'right' });

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
*/

// ============================================================================
// CONVERSIÓN SVG A IMAGEN (OBSOLETA)
// ============================================================================
/*

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
*/

// ============================================================================
// EXTRACCIÓN DE DATOS DEL HTML (OBSOLETAS)
// ============================================================================
/*

function extraerDatosDelModal(modalContent) {
  const datos = {
    fecha: modalContent.querySelector('.pdf-header-ref-right')?.textContent?.trim() || '',
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
      datos.numLamas = texto.replace('Número de lamas (tabla):', '').trim();
    } else if (texto.includes('Mando:')) {
      datos.mando = texto.replace('Mando:', '').trim();
    }
  });

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
*/

// ============================================================================
// FIN DE FUNCIONES OBSOLETAS
// ============================================================================

// ============================================================================
// FUNCIONES DE GENERACIÓN HTML (ACTIVAS - USADAS PARA VISTA PREVIA)
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
          <h1 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #0054a6; text-align: center;">
            Presupuesto Pérgola Bioclimática Doha Sun
          </h1>
        </div>
          <div class="pdf-subtitulo-ref">Presupuesto Pérgola Bioclimática · Doha Sun</div>
        </div>
        <div class="pdf-header-ref-right">
          ${fechaFormateada}
        </div>
      </div>
      <div class="pdf-divider-ref"></div>
    </header>
  `;
}

function generarBloqueDatosPresupuesto(datos) {
  // Leer avisos del DOM
  const avisoRefuerzo = document.getElementById('avisoRefuerzo');
  const resumenAvisos = document.getElementById('resumenAvisosMontaje');
  
  let avisosHTML = '';
  if (avisoRefuerzo && avisoRefuerzo.style.display !== 'none' && avisoRefuerzo.textContent.trim()) {
    avisosHTML += `<div class="aviso-amarillo" style="margin-top: 0.75rem;">${avisoRefuerzo.textContent}</div>`;
  }
  if (resumenAvisos && resumenAvisos.getAttribute('data-show-pdf') === '1' && resumenAvisos.textContent.trim()) {
    avisosHTML += `<div class="aviso-amarillo" style="margin-top: 0.75rem;">${resumenAvisos.textContent}</div>`;
  }

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
          <li><strong>Número de lamas (tabla):</strong> ${datos.numLamas}</li>
          <li><strong>Mando:</strong> ${datos.mandoTexto}</li>
        </ul>
        ${avisosHTML}
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
      <td>SIN ESPECIFICAR</td>
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
    <div class="pdf-bloque-totales" style="width: 100%; margin: 1.5rem 0; padding: 1rem; border: 2px solid #0054a6; border-radius: 0.5rem; background: #f8faff;">
      <h3 class="pdf-totales-titulo" style="margin: 0 0 1rem 0; font-size: 1.2rem; color: #0054a6;">Resumen económico</h3>
      <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.75rem; font-size: 1rem;">
        <div class="pdf-total-fila" style="display: contents;">
          <span style="font-weight: 500;">Total perfiles</span>
          <span style="font-weight: 600;">${precioFormatearEuro(totales.subtotalAluminio || 0)}</span>
        </div>
        <div class="pdf-total-fila" style="display: contents;">
          <span style="font-weight: 500;">Total accesorios</span>
          <span style="font-weight: 600;">${precioFormatearEuro(totales.subtotalAccesorios || 0)}</span>
        </div>
        <div class="pdf-total-fila pdf-total-destacado" style="display: contents; border-top: 2px solid #0054a6; padding-top: 0.75rem; margin-top: 0.75rem;">
          <span style="font-weight: 700; font-size: 1.2rem; color: #0054a6; grid-column: 1;">TOTAL MATERIALES</span>
          <span style="font-weight: 700; font-size: 1.2rem; color: #0054a6; grid-column: 2;">${precioFormatearEuro(totales.totalGeneral || 0)}</span>
        </div>
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
  
  // Referencia de presupuesto
  const codigoElement = document.getElementById('refCodeInline');
  const codigoPresupuesto = codigoElement?.textContent?.trim() || generarCodigoRef();
  
  // Fecha
  const fecha = generarFechaFormateada();

  return {
    comercial, cliente, refObra,
    ancho, salida, altura, modulos,
    tipoMontajeTexto, numPilares,
    modoMotorTexto, numLamas, mandoTexto,
    codigoPresupuesto, fecha
  };
}

function obtenerTipoDocumento() {
  const selector = document.getElementById('selectorDocumento');
  return selector ? selector.value : 'material';
}

function generarNombreArchivo(tipo) {
  const codigoElement = document.getElementById('refCodeInline');
  const codigo = codigoElement ? codigoElement.textContent : generarTimestamp();

  let prefijo = 'PRESUPUESTO';
  if (tipo === 'corte') prefijo = 'HOJA_CORTE';
  if (tipo === 'peso') prefijo = 'PESO_PERIMETROS';

  return `${prefijo}_${codigo}.pdf`;
}

function generarTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export function compartirWhatsApp() {
  alert('Función de compartir WhatsApp - En desarrollo');
}
