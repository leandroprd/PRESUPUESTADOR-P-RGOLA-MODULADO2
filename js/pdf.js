/**
 * MÓDULO DE EXPORTACIÓN DE PDFs
 * =================================================================
 * Sistema simplificado que exporta los documentos HTML ya existentes.
 * Los documentos se rellenan en tiempo real por las funciones de renderizado.
 * Este módulo solo se encarga de tomar el contenedor correcto y exportarlo.
 */

// ============================================================================
// FUNCIÓN DE INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa el sistema de PDFs conectando los botones
 */
export function inicializarSistemaPDF() {
  const btnDescargar = document.getElementById('btnDescargarPDF');
  const btnWhatsApp = document.getElementById('btnCompartirWhatsApp');

  if (btnDescargar) {
    btnDescargar.addEventListener('click', descargarPDF);
  }

  if (btnWhatsApp) {
    btnWhatsApp.addEventListener('click', compartirWhatsApp);
  }

  console.log('✅ Sistema PDF inicializado correctamente');
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Descarga el PDF del documento seleccionado
 */
export function descargarPDF() {
  console.log('📥 Iniciando descarga de PDF...');

  const contenedor = obtenerContenedorPDF();
  if (!contenedor) {
    alert('Error: No se pudo obtener el contenedor del documento.');
    return;
  }

  const nombreArchivo = generarNombreArchivo();
  console.log('📄 Nombre archivo:', nombreArchivo);

  exportarAPdf(contenedor, nombreArchivo);
}

/**
 * Comparte el documento por WhatsApp
 */
export function compartirWhatsApp() {
  console.log('📤 Compartiendo por WhatsApp...');

  const contenedor = obtenerContenedorPDF();
  if (!contenedor) {
    alert('Error: No se pudo obtener el contenedor del documento.');
    return;
  }

  // Primero generar el PDF
  const nombreArchivo = generarNombreArchivo();
  
  // Generar PDF y luego abrir WhatsApp
  generarPdfYCompartir(contenedor, nombreArchivo);
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene el contenedor PDF según el documento seleccionado
 * @returns {HTMLElement|null} Contenedor del documento
 */
function obtenerContenedorPDF() {
  const selector = document.getElementById('selectorDocumento');
  if (!selector) {
    console.error('❌ No se encuentra el selector de documento');
    return null;
  }

  const tipo = selector.value;
  console.log('📋 Tipo de documento:', tipo);

  let contenedor;
  switch (tipo) {
    case 'material':
      contenedor = document.getElementById('pdf-presupuesto');
      break;
    case 'corte':
      contenedor = document.getElementById('pdf-hoja-corte');
      break;
    case 'peso':
      contenedor = document.getElementById('pdf-peso-perimetros');
      break;
    default:
      console.error('❌ Tipo de documento no reconocido:', tipo);
      return null;
  }

  if (!contenedor) {
    console.error('❌ No se encontró el contenedor para:', tipo);
    return null;
  }

  console.log('✅ Contenedor obtenido:', contenedor.id);
  return contenedor;
}

/**
 * Genera el nombre del archivo según el tipo de documento
 * @returns {string} Nombre del archivo
 */
function generarNombreArchivo() {
  const selector = document.getElementById('selectorDocumento');
  const tipo = selector ? selector.value : 'material';
  
  // Obtener código de presupuesto si existe
  const codigoElement = document.getElementById('refCodeInline');
  const codigo = codigoElement ? codigoElement.textContent : generarTimestamp();

  let prefijo = 'PRESUPUESTO';
  if (tipo === 'corte') prefijo = 'HOJA_CORTE';
  if (tipo === 'peso') prefijo = 'PESO_PERIMETROS';

  return `${prefijo}_${codigo}.pdf`;
}

/**
 * Genera un timestamp para nombres de archivo
 * @returns {string} Timestamp en formato YYYYMMDD-HHMMSS
 */
function generarTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * Exporta el contenedor a PDF usando html2pdf
 * @param {HTMLElement} elemento - Elemento a exportar
 * @param {string} nombreArchivo - Nombre del archivo PDF
 */
function exportarAPdf(elemento, nombreArchivo) {
  if (typeof html2pdf === 'undefined') {
    console.error('❌ html2pdf no está cargado');
    alert('Error: Librería de PDF no encontrada. Por favor, recarga la página.');
    return;
  }

  console.log('🚀 Generando PDF...');

  // Hacer temporalmente visible para html2pdf
  const originalOpacity = elemento.style.opacity;
  const originalZIndex = elemento.style.zIndex;
  
  elemento.style.opacity = '1';
  elemento.style.zIndex = '9999';

  const opt = {
    margin: 10,
    filename: nombreArchivo,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: { 
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  html2pdf()
    .from(elemento)
    .set(opt)
    .save()
    .then(() => {
      console.log('✅ PDF generado correctamente:', nombreArchivo);
      // Restaurar estado original
      elemento.style.opacity = originalOpacity;
      elemento.style.zIndex = originalZIndex;
    })
    .catch(error => {
      console.error('❌ Error al generar PDF:', error);
      alert('Error al generar el PDF. Revisa la consola para más detalles.');
      // Restaurar estado original
      elemento.style.opacity = originalOpacity;
      elemento.style.zIndex = originalZIndex;
    });
}

/**
 * Genera el PDF y abre WhatsApp para compartir
 * @param {HTMLElement} elemento - Elemento a exportar
 * @param {string} nombreArchivo - Nombre del archivo
 */
function generarPdfYCompartir(elemento, nombreArchivo) {
  if (typeof html2pdf === 'undefined') {
    console.error('❌ html2pdf no está cargado');
    alert('Error: Librería de PDF no encontrada.');
    return;
  }

  console.log('🚀 Generando PDF para compartir...');

  // Hacer temporalmente visible
  const originalOpacity = elemento.style.opacity;
  const originalZIndex = elemento.style.zIndex;
  
  elemento.style.opacity = '1';
  elemento.style.zIndex = '9999';

  const opt = {
    margin: 10,
    filename: nombreArchivo,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: { 
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  html2pdf()
    .from(elemento)
    .set(opt)
    .save()
    .then(() => {
      console.log('✅ PDF generado, abriendo WhatsApp...');
      
      // Restaurar estado
      elemento.style.opacity = originalOpacity;
      elemento.style.zIndex = originalZIndex;

      // Construir mensaje para WhatsApp
      const tipoDoc = document.getElementById('selectorDocumento')?.value || 'material';
      let tipoTexto = 'Presupuesto';
      if (tipoDoc === 'corte') tipoTexto = 'Hoja de corte';
      if (tipoDoc === 'peso') tipoTexto = 'Peso y perímetros';

      const mensaje = `${tipoTexto} - Pérgola Bioclimática DOHA SUN\n\nAdjunto encontrarás el documento ${nombreArchivo}`;
      const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

      // Abrir WhatsApp en nueva ventana
      window.open(url, '_blank');
    })
    .catch(error => {
      console.error('❌ Error al generar PDF:', error);
      alert('Error al generar el PDF. Revisa la consola para más detalles.');
      
      // Restaurar estado
      elemento.style.opacity = originalOpacity;
      elemento.style.zIndex = originalZIndex;
    });
}
