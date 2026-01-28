/**
 * MÓDULO DE EXPORTACIÓN DE PDFs CON VISTA PREVIA
 * =================================================================
 * Sistema con modal de vista previa y exportación usando html2pdf 0.9.3
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

// Variables globales
let modalAbierto = false;
let tipoDocumentoActual = 'material';

// ============================================================================
// FUNCIÓN DE INICIALIZACIÓN
// ============================================================================

export function inicializarSistemaPDF() {
  const btnVistaPrevia = document.getElementById('btnVistaPreviaPDF');
  const btnWhatsApp = document.getElementById('btnCompartirWhatsApp');
  const btnCerrarModal = document.getElementById('btnCerrarModal');
  const btnCerrarModalFooter = document.getElementById('btnCerrarModalFooter');
  const btnDescargarDesdeModal = document.getElementById('btnDescargarDesdeLmodal');

  if (btnVistaPrevia) {
    btnVistaPrevia.addEventListener('click', abrirVistaPreviaPDF);
  }

  if (btnWhatsApp) {
    btnWhatsApp.addEventListener('click', compartirWhatsApp);
  }

  if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', cerrarModal);
  }

  if (btnCerrarModalFooter) {
    btnCerrarModalFooter.addEventListener('click', cerrarModal);
  }

  if (btnDescargarDesdeModal) {
    btnDescargarDesdeModal.addEventListener('click', descargarPDFDesdeModal);
  }

  // Cerrar modal al hacer clic en el overlay
  const overlay = document.querySelector('.pdf-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', cerrarModal);
  }

  console.log('✅ Sistema PDF inicializado correctamente');
}

// ============================================================================
// FUNCIONES DEL MODAL
// ============================================================================

/**
 * Abre el modal de vista previa con el documento seleccionado
 */
export function abrirVistaPreviaPDF() {
  console.log('👁️ Abriendo vista previa...');

  // 1. Obtener tipo de documento
  const tipo = obtenerTipoDocumento();
  tipoDocumentoActual = tipo;

  // 2. Rellenar documento
  if (!rellenarDocumentoPDF(tipo)) {
    alert('No hay datos calculados. Por favor, calcula primero la configuración.');
    return;
  }

  // 3. Clonar contenido al modal
  const contenedorOriginal = obtenerContenedorPDF(tipo);
  if (!contenedorOriginal) {
    alert('Error: No se pudo obtener el contenedor del documento.');
    return;
  }

  const modalContent = document.getElementById('pdfPreviewContent');
  if (!modalContent) {
    console.error('❌ No se encuentra el contenedor del modal');
    return;
  }

  // Clonar el contenido
  modalContent.innerHTML = contenedorOriginal.innerHTML;

  // 4. Mostrar modal
  const modal = document.getElementById('pdfPreviewModal');
  if (modal) {
    modal.style.display = 'block';
    modalAbierto = true;
    console.log('✅ Modal abierto con vista previa');
  }
}

/**
 * Cierra el modal de vista previa
 */
export function cerrarModal() {
  const modal = document.getElementById('pdfPreviewModal');
  if (modal) {
    modal.style.display = 'none';
    modalAbierto = false;
    console.log('✅ Modal cerrado');
  }
}

/**
 * Descarga el PDF desde el modal
 */
export function descargarPDFDesdeModal() {
  console.log('📥 Descargando PDF desde modal...');

  const modalContent = document.getElementById('pdfPreviewContent');
  if (!modalContent) {
    alert('Error: No se encuentra el contenido del modal.');
    return;
  }

  const nombreArchivo = generarNombreArchivo(tipoDocumentoActual);
  exportarAPdf(modalContent, nombreArchivo);
}

/**
 * Comparte el documento por WhatsApp
 */
export function compartirWhatsApp() {
  console.log('📤 Compartiendo por WhatsApp...');

  // 1. Rellenar documento
  const tipo = obtenerTipoDocumento();
  if (!rellenarDocumentoPDF(tipo)) {
    alert('No hay datos calculados. Por favor, calcula primero la configuración.');
    return;
  }

  // 2. Obtener contenedor
  const contenedor = obtenerContenedorPDF(tipo);
  if (!contenedor) {
    alert('Error: No se pudo obtener el contenedor del documento.');
    return;
  }

  // 3. Generar y compartir
  const nombreArchivo = generarNombreArchivo(tipo);
  generarPdfYCompartir(contenedor, nombreArchivo, tipo);
}

// ============================================================================
// FUNCIONES DE RELLENO AUTOMÁTICO
// ============================================================================

/**
 * Rellena el documento PDF seleccionado con todos los datos actuales
 */
function rellenarDocumentoPDF(tipo) {
  console.log('🔄 Rellenando documento:', tipo);

  // Obtener datos
  const informe = obtenerUltimoInforme();
  if (!informe) {
    console.error('❌ No hay informe disponible');
    return false;
  }

  const totales = obtenerTotales();
  const datosContexto = leerDatosContexto();

  // Rellenar datos comunes
  rellenarDatosComunes(tipo, datosContexto);

  // Rellenar según tipo
  switch (tipo) {
    case 'material':
      rellenarPresupuesto(informe, totales, datosContexto);
      break;
    case 'corte':
      rellenarHojaCorte(informe, datosContexto);
      break;
    case 'peso':
      rellenarPesoPerimetros(informe, totales, datosContexto);
      break;
  }

  console.log('✅ Documento rellenado correctamente');
  return true;
}

/**
 * Rellena los datos comunes (cabecera, configuración)
 */
function rellenarDatosComunes(tipo, datos) {
  const prefijo = tipo === 'material' ? 'presupuesto' : tipo === 'corte' ? 'corte' : 'peso';
  
  // Fecha
  const fechaElement = document.getElementById(`pdf-${prefijo}-fecha`);
  if (fechaElement) fechaElement.textContent = datos.fecha;
  
  // Código
  const codigoElement = document.getElementById(`pdf-${prefijo}-codigo`);
  if (codigoElement) codigoElement.textContent = datos.codigoPresupuesto;
  
  // Cabecera
  const comercialElement = document.getElementById(`pdf-${prefijo}-comercial`);
  if (comercialElement) comercialElement.textContent = datos.comercial || '—';
  
  const clienteElement = document.getElementById(`pdf-${prefijo}-cliente`);
  if (clienteElement) clienteElement.textContent = datos.cliente || '—';
  
  const refObraElement = document.getElementById(`pdf-${prefijo}-refobra`);
  if (refObraElement) refObraElement.textContent = datos.refObra || '—';
  
  // Configuración
  const configHtml = `
    <li><strong>Largo/salida:</strong> ${datos.salida.toFixed(2)} m · <strong>Ancho:</strong> ${datos.ancho.toFixed(2)} m · <strong>Altura libre:</strong> ${datos.altura.toFixed(2)} m</li>
    <li><strong>Módulos:</strong> ${datos.modulos}</li>
    <li><strong>Tipo de montaje:</strong> ${datos.tipoMontajeTexto}</li>
    <li><strong>Nº pilares:</strong> ${datos.numPilares}</li>
    <li><strong>Motores:</strong> ${datos.modoMotorTexto}</li>
    <li><strong>Número de lamas:</strong> ${datos.numLamas}</li>
    <li><strong>Mando:</strong> ${datos.mandoTexto}</li>
  `;
  
  const configElement = document.getElementById(`pdf-${prefijo}-config`);
  if (configElement) configElement.innerHTML = configHtml;
}

/**
 * Rellena el documento de presupuesto
 */
function rellenarPresupuesto(informe, totales, datos) {
  // SVG
  const svgContainer = document.getElementById('svg-container');
  const svgPdf = document.getElementById('pdf-presupuesto-svg');
  if (svgContainer && svgPdf) {
    svgPdf.innerHTML = svgContainer.innerHTML || '<div style="font-size: 10px; color: #9ca3af; font-style: italic;">Esquema no disponible</div>';
  }

  // Tabla de materiales
  const tbody = document.getElementById('pdf-presupuesto-tabla-body');
  if (tbody && informe.detalleMaterial) {
    let html = '';
    informe.detalleMaterial.forEach(item => {
      html += `
        <tr>
          <td>${item.tipo || '—'}</td>
          <td>${item.ref || '—'}</td>
          <td>${item.descripcion || '—'}</td>
          <td>${item.acabado || '—'}</td>
          <td style="text-align:right;">${item.longitudBarra || '—'}</td>
          <td style="text-align:right;">${item.numBarras || '—'}</td>
          <td style="text-align:right;">${item.precioUnitario || '—'}</td>
          <td style="text-align:right;">${item.importe !== undefined ? precioFormatearEuro(item.importe) : '—'}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  // Totales
  const totalesDiv = document.getElementById('pdf-presupuesto-totales');
  if (totalesDiv && totales) {
    totalesDiv.innerHTML = `
      <div class="pdf-totales-row">
        <span>Subtotal aluminio</span>
        <span>${precioFormatearEuro(totales.subtotalAluminio || 0)}</span>
      </div>
      <div class="pdf-totales-row">
        <span>Subtotal accesorios</span>
        <span>${precioFormatearEuro(totales.subtotalAccesorios || 0)}</span>
      </div>
      <div class="pdf-totales-row pdf-totales-total">
        <span>Total presupuesto</span>
        <span>${precioFormatearEuro(totales.totalGeneral || 0)}</span>
      </div>
    `;
  }
}

/**
 * Rellena el documento de hoja de corte
 */
function rellenarHojaCorte(informe, datos) {
  const contenedor = document.getElementById('pdf-corte-patrones');
  if (!contenedor || !informe.detalleHojaCorte) return;

  let html = '';
  informe.detalleHojaCorte.forEach(perfilData => {
    html += `
      <div style="margin-bottom: 1rem; page-break-inside: avoid;">
        <h3 style="font-size: 11px; font-weight: 700; margin: 0.5rem 0 0.25rem; color: #1f2937;">
          ${perfilData.ref} - ${perfilData.descripcion}
        </h3>
        <p style="font-size: 9px; margin: 0 0 0.4rem; color: #6b7280;">
          Acabado: ${perfilData.acabado}
        </p>
    `;

    if (perfilData.barras && perfilData.barras.length > 0) {
      perfilData.barras.forEach((barra, idx) => {
        const piezasStr = barra.piezas.map(p => `${p}mm`).join(', ');
        html += `
          <div style="font-size: 9px; padding: 0.3rem 0.5rem; border: 1px solid #e5e7eb; border-radius: 4px; margin-bottom: 0.25rem; background: #f9fafb;">
            <strong>Barra ${idx + 1}:</strong> ${(barra.longitud / 1000).toFixed(1)}m → 
            <strong>${barra.piezas.length} piezas:</strong> ${piezasStr} 
            · <strong>Desperdicio:</strong> ${barra.desperdicio ? barra.desperdicio.toFixed(0) : 0}mm
          </div>
        `;
      });
      html += `
        <p style="font-size: 9px; margin: 0.4rem 0 0; font-weight: 600;">
          Total: ${perfilData.totalBarras || 0} barras · ${perfilData.totalPiezas || 0} piezas
        </p>
      `;
    }
    html += `</div>`;
  });

  contenedor.innerHTML = html;
}

/**
 * Rellena el documento de peso y perímetros
 */
function rellenarPesoPerimetros(informe, totales, datos) {
  // Tabla
  const tbody = document.getElementById('pdf-peso-tabla-body');
  if (tbody && informe.detallePesoPerimetro) {
    let html = '';
    informe.detallePesoPerimetro.forEach(item => {
      html += `
        <tr>
          <td>${item.ref || '—'}</td>
          <td>${item.descripcion || '—'}</td>
          <td>${item.acabado || '—'}</td>
          <td style="text-align:right;">${item.pesoTotal !== undefined ? item.pesoTotal.toFixed(2) : '—'}</td>
          <td style="text-align:right;">${item.perimetroTotal !== undefined ? item.perimetroTotal.toFixed(0) : '—'}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  // Totales
  const totalesDiv = document.getElementById('pdf-peso-totales');
  if (totalesDiv && totales) {
    totalesDiv.innerHTML = `
      <div class="pdf-totales-row pdf-totales-total">
        <span>Peso total estructura</span>
        <span>${totales.pesoTotal !== undefined ? totales.pesoTotal.toFixed(2) : '0.00'} kg</span>
      </div>
      <div class="pdf-totales-row">
        <span>Perímetro total</span>
        <span>${totales.perimetroTotal !== undefined ? totales.perimetroTotal.toFixed(0) : '0'} mm</span>
      </div>
    `;
  }
}

// ============================================================================
// FUNCIONES DE LECTURA DE DATOS
// ============================================================================

function leerDatosContexto() {
  const comercial = document.getElementById('inputComercial')?.value || '';
  const cliente = document.getElementById('inputCliente')?.value || '';
  const refObra = document.getElementById('inputRefObra')?.value || '';
  
  const ancho = parseFloat(document.getElementById('ancho')?.value) || 0;
  const salida = parseFloat(document.getElementById('salida')?.value) || 0;
  const altura = parseFloat(document.getElementById('altura')?.value) || 0;
  
  const variosModulos = document.getElementById('variosModulos')?.checked || false;
  const modulos = variosModulos ? parseInt(document.getElementById('numModulos')?.value, 10) || 1 : 1;
  
  const tipoMontajeTexto = document.getElementById('tipoMontaje')?.selectedOptions[0]?.text || '';
  
  const numPilaresText = document.getElementById('numPilaresCalc')?.textContent || '0';
  const numPilares = parseInt(numPilaresText, 10) || 0;
  
  const modoMotor = document.querySelector('input[name="modoMotor"]:checked')?.value || 'todos-izquierda';
  const modoMotorTexto = modoMotor === 'todos-izquierda' ? 'Todos a izquierda' 
    : modoMotor === 'todos-derecha' ? 'Todos a derecha' : 'Personalizado';
  
  const numLamasText = document.getElementById('numLamasDisplay')?.textContent || '0';
  const numLamas = parseInt(numLamasText, 10) || 0;
  
  const mando = document.getElementById('mando')?.value || 'con';
  const mandoTexto = mando === 'con' ? 'Con mando (1 ud.)' : 'Sin mando';
  
  const codigoElement = document.getElementById('refCodeInline');
  const codigoPresupuesto = codigoElement ? codigoElement.textContent : generarCodigoRef();
  
  const fecha = generarFechaFormateada();

  return {
    comercial, cliente, refObra,
    ancho, salida, altura, modulos,
    tipoMontajeTexto, numPilares,
    modoMotorTexto, numLamas, mandoTexto,
    codigoPresupuesto, fecha
  };
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function obtenerTipoDocumento() {
  const selector = document.getElementById('selectorDocumento');
  return selector ? selector.value : 'material';
}

function obtenerContenedorPDF(tipo) {
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
  }
  return contenedor;
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

// ============================================================================
// EXPORTACIÓN A PDF (html2pdf 0.9.3)
// ============================================================================

function exportarAPdf(elemento, nombreArchivo) {
  if (typeof html2pdf === 'undefined') {
    console.error('❌ html2pdf no está cargado');
    alert('Error: Librería de PDF no encontrada. Por favor, recarga la página.');
    return;
  }

  console.log('🚀 Generando PDF con html2pdf 0.9.3...');

  const opt = {
    margin: 0,
    filename: nombreArchivo,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
  };

  html2pdf()
    .set(opt)
    .from(elemento)
    .save()
    .then(() => {
      console.log('✅ PDF generado correctamente:', nombreArchivo);
    })
    .catch(error => {
      console.error('❌ Error al generar PDF:', error);
      alert('Error al generar el PDF. Revisa la consola para más detalles.');
    });
}

function generarPdfYCompartir(elemento, nombreArchivo, tipo) {
  if (typeof html2pdf === 'undefined') {
    console.error('❌ html2pdf no está cargado');
    alert('Error: Librería de PDF no encontrada.');
    return;
  }

  console.log('🚀 Generando PDF para compartir...');

  const opt = {
    margin: 0,
    filename: nombreArchivo,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
  };

  html2pdf()
    .set(opt)
    .from(elemento)
    .save()
    .then(() => {
      console.log('✅ PDF generado, abriendo WhatsApp...');

      let tipoTexto = 'Presupuesto';
      if (tipo === 'corte') tipoTexto = 'Hoja de corte';
      if (tipo === 'peso') tipoTexto = 'Peso y perímetros';

      const mensaje = `${tipoTexto} - Pérgola Bioclimática DOHA SUN\n\nAdjunto encontrarás el documento ${nombreArchivo}`;
      const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

      window.open(url, '_blank');
    })
    .catch(error => {
      console.error('❌ Error al generar PDF:', error);
      alert('Error al generar el PDF. Revisa la consola para más detalles.');
    });
}
