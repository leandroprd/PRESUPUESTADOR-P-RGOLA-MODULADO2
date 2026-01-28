/**
 * SISTEMA PDF PROFESIONAL CON PAGINACIÓN A4
 * =================================================================
 * - Logo Galisur en cabecera
 * - Paginación real A4 (210x297mm)
 * - Cabecera y pie repetidos en cada página
 * - Tabla con thead repetido
 * - SVG del esquema incluido
 * - Márgenes profesionales
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

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG_PDF = {
  FILAS_PAGINA_1: 15,        // Filas en página 1 (tiene esquema)
  FILAS_PAGINA_RESTO: 25,    // Filas en páginas siguientes
  LOGO_PATH: './js/logo.png',
  LOGO_ANCHO_MM: 45          // Ancho del logo en mm
};

// Variables globales
let logoBase64 = null;
let modalAbierto = false;
let tipoDocumentoActual = 'material';

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

export async function inicializarSistemaPDF() {
  // Cargar logo
  await cargarLogo();
  
  // Configurar botones
  const btnVistaPrevia = document.getElementById('btnVistaPreviaPDF');
  const btnWhatsApp = document.getElementById('btnCompartirWhatsApp');
  const btnCerrarModal = document.getElementById('btnCerrarModal');
  const btnCerrarModalFooter = document.getElementById('btnCerrarModalFooter');
  const btnDescargarDesdeModal = document.getElementById('btnDescargarDesdeModal');

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

  // Cerrar modal con overlay
  const overlay = document.querySelector('.pdf-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', cerrarModal);
  }

  console.log('✅ Sistema PDF profesional inicializado');
}

/**
 * Carga el logo y lo convierte a base64
 */
async function cargarLogo() {
  try {
    const response = await fetch(CONFIG_PDF.LOGO_PATH);
    if (!response.ok) {
      console.warn('⚠️ Logo no encontrado en', CONFIG_PDF.LOGO_PATH);
      return;
    }
    
    const blob = await response.blob();
    logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    
    console.log('✅ Logo cargado correctamente');
  } catch (error) {
    console.error('❌ Error al cargar logo:', error);
  }
}

// ============================================================================
// FUNCIONES DEL MODAL
// ============================================================================

export function abrirVistaPreviaPDF() {
  console.log('👁️ Abriendo vista previa...');

  const tipo = obtenerTipoDocumento();
  tipoDocumentoActual = tipo;

  // Generar documento paginado
  const htmlPaginado = generarDocumentoPaginado(tipo);
  if (!htmlPaginado) {
    alert('No hay datos calculados. Por favor, calcula primero la configuración.');
    return;
  }

  // Mostrar en modal
  const modalContent = document.getElementById('pdfPreviewContent');
  if (!modalContent) {
    console.error('❌ No se encuentra el contenedor del modal');
    return;
  }

  modalContent.innerHTML = htmlPaginado;

  // Abrir modal
  const modal = document.getElementById('pdfPreviewModal');
  if (modal) {
    modal.style.display = 'block';
    modalAbierto = true;
    console.log('✅ Modal abierto con vista previa paginada');
  }
}

export function cerrarModal() {
  const modal = document.getElementById('pdfPreviewModal');
  if (modal) {
    modal.style.display = 'none';
    modalAbierto = false;
    console.log('✅ Modal cerrado');
  }
}

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

export function compartirWhatsApp() {
  console.log('📤 Compartiendo por WhatsApp...');

  const tipo = obtenerTipoDocumento();
  const htmlPaginado = generarDocumentoPaginado(tipo);
  
  if (!htmlPaginado) {
    alert('No hay datos calculados. Por favor, calcula primero la configuración.');
    return;
  }

  // Crear contenedor temporal
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlPaginado;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  document.body.appendChild(tempDiv);

  const nombreArchivo = generarNombreArchivo(tipo);
  
  generarPdfYCompartir(tempDiv, nombreArchivo, tipo, () => {
    document.body.removeChild(tempDiv);
  });
}

// ============================================================================
// GENERACIÓN DE DOCUMENTO PAGINADO
// ============================================================================

/**
 * Genera el documento completo con paginación profesional
 */
function generarDocumentoPaginado(tipo) {
  console.log('📄 Generando documento paginado:', tipo);

  const informe = obtenerUltimoInforme();
  if (!informe) {
    console.error('❌ No hay informe disponible');
    return null;
  }

  const totales = obtenerTotales();
  const datos = leerDatosContexto();

  // Solo procesamos presupuesto por ahora (el más complejo)
  if (tipo === 'material') {
    return generarPresupuestoPaginado(informe, totales, datos);
  } else if (tipo === 'corte') {
    return generarHojaCortePaginada(informe, datos);
  } else {
    return generarPesoPerimetrosPaginado(informe, totales, datos);
  }
}

/**
 * Genera el presupuesto con paginación A4
 */
function generarPresupuestoPaginado(informe, totales, datos) {
  const materiales = informe.detalleMaterial || [];
  const paginasHTML = [];
  
  let filaActual = 0;
  let numeroPagina = 1;

  // PÁGINA 1: Datos + Esquema + Primeras filas de tabla
  const filasPagina1 = materiales.slice(0, CONFIG_PDF.FILAS_PAGINA_1);
  paginasHTML.push(generarPagina1Presupuesto(filasPagina1, datos, numeroPagina));
  filaActual = CONFIG_PDF.FILAS_PAGINA_1;
  numeroPagina++;

  // PÁGINAS SIGUIENTES: Solo tabla
  while (filaActual < materiales.length) {
    const filasPagina = materiales.slice(filaActual, filaActual + CONFIG_PDF.FILAS_PAGINA_RESTO);
    const esUltimaPagina = (filaActual + CONFIG_PDF.FILAS_PAGINA_RESTO) >= materiales.length;
    
    paginasHTML.push(
      generarPaginaSiguientePresupuesto(filasPagina, datos, numeroPagina, esUltimaPagina, totales)
    );
    
    filaActual += CONFIG_PDF.FILAS_PAGINA_RESTO;
    numeroPagina++;
  }

  // Si no hubo páginas adicionales, añadir totales a página 1
  if (paginasHTML.length === 1) {
    paginasHTML[0] = paginasHTML[0].replace(
      '</section>',
      `${generarBloqueTotales(totales)}</section>`
    );
  }

  return `<div class="pdf-documento-multipagina">${paginasHTML.join('')}</div>`;
}

/**
 * Genera la primera página del presupuesto
 */
function generarPagina1Presupuesto(filas, datos, numPagina) {
  return `
    <div class="pdf-page-a4">
      ${generarCabecera(datos, numPagina, 'PRESUPUESTO PÉRGOLA BIOCLIMÁTICA · DOHA SUN')}
      
      <section class="pdf-content-a4">
        ${generarBloqueDatosPresupuesto(datos)}
        ${generarBloqueEsquema()}
        ${generarTablaInicio(filas)}
      </section>
      
      ${generarPie(numPagina)}
    </div>
  `;
}

/**
 * Genera páginas siguientes del presupuesto
 */
function generarPaginaSiguientePresupuesto(filas, datos, numPagina, esUltima, totales) {
  const totalesHTML = esUltima ? generarBloqueTotales(totales) : '';
  
  return `
    <div class="pdf-page-a4">
      ${generarCabecera(datos, numPagina, 'PRESUPUESTO PÉRGOLA BIOCLIMÁTICA · DOHA SUN')}
      
      <section class="pdf-content-a4">
        ${generarTablaContinuacion(filas)}
        ${totalesHTML}
      </section>
      
      ${generarPie(numPagina)}
    </div>
  `;
}

// ============================================================================
// COMPONENTES DEL DOCUMENTO
// ============================================================================

/**
 * Genera la cabecera repetible con formato del PDF de referencia
 */
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
          <div class="pdf-empresa-ref">ALUMINIOS GALISUR</div>
          <div class="pdf-subtitulo-ref">PRESUPUESTO PÉRGOLA BIOCLIMÁTICA · DOHA SUN</div>
        </div>
        <div class="pdf-header-ref-right">
          ${fechaFormateada}
        </div>
      </div>
      <div class="pdf-divider-ref"></div>
    </header>
  `;
}

/**
 * Genera el bloque de datos del presupuesto con formato de referencia
 */
function generarBloqueDatosPresupuesto(datos) {
  return `
    <div class="pdf-resumen-config-ref">
      <div class="pdf-resumen-header-ref">
        <div>
          <h2 class="pdf-titulo-seccion-ref">Resumen de configuración</h2>
          <div class="pdf-ref-presupuesto">Ref. presupuesto: ${datos.codigoPresupuesto}</div>
        </div>
        <div class="pdf-badge-previo">PREVIO A MATERIALES</div>
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
      </div>
    </div>
  `;
}

/**
 * Genera el bloque del esquema SVG
 */
function generarBloqueEsquema() {
  // Buscar el SVG en varios contenedores posibles
  let svgContent = '';
  
  // Intentar primero con svg-container
  let svgWeb = document.getElementById('svg-container');
  
  // Si no existe, buscar cualquier SVG en la tarjeta 4
  if (!svgWeb || !svgWeb.innerHTML.trim()) {
    // Buscar en la tarjeta de vista esquemática
    const tarjetas = document.querySelectorAll('.card');
    for (const tarjeta of tarjetas) {
      const titulo = tarjeta.querySelector('.card-title');
      if (titulo && titulo.textContent.includes('Vista esquemática')) {
        const svg = tarjeta.querySelector('svg');
        if (svg) {
          svgWeb = svg.parentElement;
          break;
        }
      }
    }
  }
  
  // Si no existe, buscar cualquier SVG visible en la página
  if (!svgWeb || !svgWeb.innerHTML.trim()) {
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      // Verificar que el SVG es visible y tiene contenido
      const rect = svg.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        svgWeb = svg.parentElement;
        break;
      }
    }
  }
  
  if (svgWeb && svgWeb.innerHTML.trim()) {
    svgContent = svgWeb.innerHTML;
    
    // Ajustar tamaño del SVG
    svgContent = svgContent.replace(
      /<svg/g,
      '<svg style="max-width: 100%; height: auto; display: block;"'
    );
    
    console.log('✅ SVG encontrado y copiado');
  } else {
    svgContent = '<div class="pdf-esquema-placeholder">Esquema no disponible</div>';
    console.warn('⚠️ No se encontró el SVG del esquema');
  }

  return `
    <div class="pdf-bloque-esquema-ref">
      <div class="pdf-esquema-contenedor-ref">
        ${svgContent}
      </div>
    </div>
  `;
}

/**
 * Genera el inicio de la tabla (con thead)
 */
function generarTablaInicio(filas) {
  return `
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
            <th style="width: 10%;">LONG. BARRA (M)</th>
            <th style="width: 10%;">Nº BARRAS / UDS</th>
            <th style="width: 10%;">PRECIO UNIT.</th>
            <th style="width: 10%;">IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          ${generarFilasTabla(filas)}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Genera continuación de tabla (con thead repetido)
 */
function generarTablaContinuacion(filas) {
  return `
    <div class="pdf-bloque-tabla">
      <table class="pdf-tabla-materiales">
        <thead>
          <tr>
            <th style="width: 8%;">TIPO</th>
            <th style="width: 8%;">REF.</th>
            <th style="width: 24%;">DESCRIPCIÓN</th>
            <th style="width: 12%;">ACABADO</th>
            <th style="width: 8%;">REF. ACABADO</th>
            <th style="width: 10%;">LONG. BARRA (M)</th>
            <th style="width: 10%;">Nº BARRAS / UDS</th>
            <th style="width: 10%;">PRECIO UNIT.</th>
            <th style="width: 10%;">IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          ${generarFilasTabla(filas)}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Genera las filas de la tabla
 */
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

/**
 * Genera el bloque de totales con formato de referencia
 */
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

/**
 * Genera el pie de página
 */
function generarPie(numPagina) {
  return `
    <footer class="pdf-footer-a4">
      <span class="pdf-footer-izq">Página ${numPagina}</span>
      <span class="pdf-footer-der">ALUMINIOS GALISUR · Pérgola Bioclimática Doha Sun</span>
    </footer>
  `;
}

// ============================================================================
// DOCUMENTOS SIMPLIFICADOS (Hoja de corte y Peso)
// ============================================================================

function generarHojaCortePaginada(informe, datos) {
  // Similar pero más simple - una sola página normalmente
  return `
    <div class="pdf-documento-multipagina">
      <div class="pdf-page-a4">
        ${generarCabecera(datos, 1, 'HOJA DE CORTE · FABRICACIÓN · DOHA SUN')}
        <section class="pdf-content-a4">
          ${generarBloqueDatosPresupuesto(datos)}
          ${generarPatronesCorte(informe)}
        </section>
        ${generarPie(1)}
      </div>
    </div>
  `;
}

function generarPesoPerimetrosPaginado(informe, totales, datos) {
  return `
    <div class="pdf-documento-multipagina">
      <div class="pdf-page-a4">
        ${generarCabecera(datos, 1, 'PESO Y PERÍMETROS · DOCUMENTO TÉCNICO · DOHA SUN')}
        <section class="pdf-content-a4">
          ${generarBloqueDatosPresupuesto(datos)}
          ${generarTablaPeso(informe, totales)}
        </section>
        ${generarPie(1)}
      </div>
    </div>
  `;
}

function generarPatronesCorte(informe) {
  if (!informe.detalleHojaCorte) return '<p>No hay datos de corte</p>';

  let html = '<div class="pdf-bloque-tabla"><h3 class="pdf-seccion-titulo">Patrones de corte</h3>';
  
  informe.detalleHojaCorte.forEach(perfil => {
    html += `
      <div style="margin-bottom: 1rem; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 4px;">
        <h4 style="font-size: 11pt; margin: 0 0 0.25rem; color: #1f2937;">
          ${perfil.ref} - ${perfil.descripcion}
        </h4>
        <p style="font-size: 9pt; margin: 0 0 0.5rem; color: #6b7280;">
          Acabado: ${perfil.acabado}
        </p>
    `;

    if (perfil.barras) {
      perfil.barras.forEach((barra, idx) => {
        const piezasStr = barra.piezas.map(p => `${p}mm`).join(', ');
        html += `
          <div style="font-size: 9pt; padding: 0.25rem 0.5rem; background: #f9fafb; margin-bottom: 0.25rem;">
            <strong>Barra ${idx + 1}:</strong> ${(barra.longitud / 1000).toFixed(1)}m → 
            ${barra.piezas.length} piezas: ${piezasStr} 
            · Desperdicio: ${barra.desperdicio ? barra.desperdicio.toFixed(0) : 0}mm
          </div>
        `;
      });
      
      html += `
        <p style="font-size: 9pt; margin: 0.5rem 0 0; font-weight: 600;">
          Total: ${perfil.totalBarras || 0} barras · ${perfil.totalPiezas || 0} piezas
        </p>
      `;
    }
    
    html += `</div>`;
  });

  html += '</div>';
  return html;
}

function generarTablaPeso(informe, totales) {
  if (!informe.detallePesoPerimetro) return '<p>No hay datos de peso</p>';

  let html = `
    <div class="pdf-bloque-tabla">
      <h3 class="pdf-seccion-titulo">Peso y perímetros por perfil</h3>
      <table class="pdf-tabla-materiales">
        <thead>
          <tr>
            <th style="width: 15%;">Ref.</th>
            <th style="width: 35%;">Descripción</th>
            <th style="width: 20%;">Acabado</th>
            <th style="width: 15%;">Peso total (kg)</th>
            <th style="width: 15%;">Perímetro (mm)</th>
          </tr>
        </thead>
        <tbody>
  `;

  informe.detallePesoPerimetro.forEach(item => {
    html += `
      <tr>
        <td>${item.ref || '—'}</td>
        <td>${item.descripcion || '—'}</td>
        <td>${item.acabado || '—'}</td>
        <td style="text-align: right;">${item.pesoTotal !== undefined ? item.pesoTotal.toFixed(2) : '—'}</td>
        <td style="text-align: right;">${item.perimetroTotal !== undefined ? item.perimetroTotal.toFixed(0) : '—'}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  // Totales
  if (totales) {
    html += `
      <div class="pdf-bloque-totales">
        <div class="pdf-total-fila pdf-total-destacado">
          <span>Peso total estructura:</span>
          <span>${totales.pesoTotal !== undefined ? totales.pesoTotal.toFixed(2) : '0.00'} kg</span>
        </div>
        <div class="pdf-total-fila">
          <span>Perímetro total:</span>
          <span>${totales.perimetroTotal !== undefined ? totales.perimetroTotal.toFixed(0) : '0'} mm</span>
        </div>
      </div>
    `;
  }

  return html;
}

// ============================================================================
// UTILIDADES
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

// ============================================================================
// EXPORTACIÓN PDF
// ============================================================================

function exportarAPdf(elemento, nombreArchivo) {
  if (typeof html2pdf === 'undefined') {
    console.error('❌ html2pdf no está cargado');
    alert('Error: Librería de PDF no encontrada.');
    return;
  }

  console.log('🚀 Generando PDF con paginación A4...');

  const opt = {
    margin: 0,
    filename: nombreArchivo,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: { 
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.pdf-page-a4'
    }
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
      alert('Error al generar el PDF.');
    });
}

function generarPdfYCompartir(elemento, nombreArchivo, tipo, callback) {
  if (typeof html2pdf === 'undefined') {
    console.error('❌ html2pdf no está cargado');
    alert('Error: Librería de PDF no encontrada.');
    return;
  }

  const opt = {
    margin: 0,
    filename: nombreArchivo,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: { 
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.pdf-page-a4'
    }
  };

  html2pdf()
    .set(opt)
    .from(elemento)
    .save()
    .then(() => {
      console.log('✅ PDF generado, abriendo WhatsApp...');

      if (callback) callback();

      let tipoTexto = 'Presupuesto';
      if (tipo === 'corte') tipoTexto = 'Hoja de corte';
      if (tipo === 'peso') tipoTexto = 'Peso y perímetros';

      const mensaje = `${tipoTexto} - Pérgola Bioclimática DOHA SUN\n\nAdjunto encontrarás el documento ${nombreArchivo}`;
      const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

      window.open(url, '_blank');
    })
    .catch(error => {
      console.error('❌ Error al generar PDF:', error);
      if (callback) callback();
    });
}
