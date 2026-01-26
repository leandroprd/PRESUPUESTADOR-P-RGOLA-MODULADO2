/**
 * MÓDULO DE ACTUALIZACIÓN DE DOCUMENTOS PDF OCULTOS
 * =================================================================
 * Este módulo contiene funciones que actualizan los 3 documentos PDF ocultos
 * en tiempo real, sincronizándolos con los datos de la aplicación.
 */

import { generarFechaFormateada, precioFormatearEuro } from './utils.js';

// ============================================================================
// ACTUALIZACIÓN DE DATOS COMUNES (LOS 3 DOCUMENTOS)
// ============================================================================

/**
 * Actualiza la fecha en todos los documentos PDF
 */
export function actualizarFechaPDF() {
  const fecha = generarFechaFormateada();
  
  document.getElementById('pdf-presupuesto-fecha').textContent = fecha;
  document.getElementById('pdf-corte-fecha').textContent = fecha;
  document.getElementById('pdf-peso-fecha').textContent = fecha;
}

/**
 * Actualiza el código de referencia en todos los documentos PDF
 * @param {string} codigo - Código de referencia
 */
export function actualizarCodigoPDF(codigo) {
  document.getElementById('pdf-presupuesto-codigo').textContent = codigo || '';
  document.getElementById('pdf-corte-codigo').textContent = codigo || '';
  document.getElementById('pdf-peso-codigo').textContent = codigo || '';
}

/**
 * Actualiza los datos de cabecera (comercial, cliente, ref obra)
 * @param {string} comercial - Nombre del comercial
 * @param {string} cliente - Nombre del cliente
 * @param {string} refObra - Referencia de la obra
 */
export function actualizarDatosCabeceraPDF(comercial, cliente, refObra) {
  // Presupuesto
  document.getElementById('pdf-presupuesto-comercial').textContent = comercial || '—';
  document.getElementById('pdf-presupuesto-cliente').textContent = cliente || '—';
  document.getElementById('pdf-presupuesto-refobra').textContent = refObra || '—';
  
  // Hoja de corte
  document.getElementById('pdf-corte-comercial').textContent = comercial || '—';
  document.getElementById('pdf-corte-cliente').textContent = cliente || '—';
  document.getElementById('pdf-corte-refobra').textContent = refObra || '—';
  
  // Peso y perímetros
  document.getElementById('pdf-peso-comercial').textContent = comercial || '—';
  document.getElementById('pdf-peso-cliente').textContent = cliente || '—';
  document.getElementById('pdf-peso-refobra').textContent = refObra || '—';
}

/**
 * Actualiza la configuración principal en todos los documentos
 * @param {object} config - Configuración de la pérgola
 */
export function actualizarConfiguracionPDF(config) {
  const {
    ancho,
    salida,
    altura,
    modulos,
    tipoMontaje,
    numPilares,
    modoMotor,
    numLamas,
    mando
  } = config;

  const htmlConfig = `
    <li><strong>Largo/salida:</strong> ${salida ? salida.toFixed(2) : '—'} m · <strong>Ancho:</strong> ${ancho ? ancho.toFixed(2) : '—'} m · <strong>Altura libre:</strong> ${altura ? altura.toFixed(2) : '—'} m</li>
    <li><strong>Módulos:</strong> ${modulos || '—'}</li>
    <li><strong>Tipo de montaje:</strong> ${tipoMontaje || '—'}</li>
    <li><strong>Nº pilares:</strong> ${numPilares || '—'}</li>
    <li><strong>Motores:</strong> ${modoMotor || '—'}</li>
    <li><strong>Número de lamas:</strong> ${numLamas || '—'}</li>
    <li><strong>Mando:</strong> ${mando || '—'}</li>
  `;

  document.getElementById('pdf-presupuesto-config').innerHTML = htmlConfig;
  document.getElementById('pdf-corte-config').innerHTML = htmlConfig;
  document.getElementById('pdf-peso-config').innerHTML = htmlConfig;
}

// ============================================================================
// ACTUALIZACIÓN DEL SVG (PRESUPUESTO)
// ============================================================================

/**
 * Actualiza el esquema SVG en el documento de presupuesto
 * @param {string} svgHtml - HTML del SVG
 */
export function actualizarSVGPDF(svgHtml) {
  const contenedor = document.getElementById('pdf-presupuesto-svg');
  if (contenedor) {
    contenedor.innerHTML = svgHtml || '<div class="pdf-imagen-placeholder" style="font-size: 10px; color: #9ca3af; font-style: italic;">Esquema no disponible</div>';
  }
}

// ============================================================================
// ACTUALIZACIÓN DE TABLA DE MATERIALES (PRESUPUESTO)
// ============================================================================

/**
 * Actualiza la tabla de materiales en el documento de presupuesto
 * @param {Array} materiales - Array de objetos con datos de materiales
 */
export function actualizarTablaMaterialesPDF(materiales) {
  const tbody = document.getElementById('pdf-presupuesto-tabla-body');
  if (!tbody) return;

  if (!materiales || materiales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: #9ca3af;">No hay datos de materiales</td></tr>';
    return;
  }

  let html = '';
  materiales.forEach(item => {
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

/**
 * Actualiza los totales en el documento de presupuesto
 * @param {object} totales - Objeto con subtotales y total
 */
export function actualizarTotalesPDF(totales) {
  const contenedor = document.getElementById('pdf-presupuesto-totales');
  if (!contenedor) return;

  if (!totales) {
    contenedor.innerHTML = '';
    return;
  }

  const html = `
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

  contenedor.innerHTML = html;
}

// ============================================================================
// ACTUALIZACIÓN DE HOJA DE CORTE
// ============================================================================

/**
 * Actualiza los patrones de corte en el documento de hoja de corte
 * @param {Array} patronesCorte - Array con datos de corte por perfil
 */
export function actualizarPatronesCorte(patronesCorte) {
  const contenedor = document.getElementById('pdf-corte-patrones');
  if (!contenedor) return;

  if (!patronesCorte || patronesCorte.length === 0) {
    contenedor.innerHTML = '<p style="font-size: 10px; color: #9ca3af;">No hay datos de corte</p>';
    return;
  }

  let html = '';
  patronesCorte.forEach(perfilData => {
    html += `
      <div class="pdf-perfil-corte" style="margin-bottom: 1rem; page-break-inside: avoid;">
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

// ============================================================================
// ACTUALIZACIÓN DE PESO Y PERÍMETROS
// ============================================================================

/**
 * Actualiza la tabla de peso y perímetros
 * @param {Array} datosPeso - Array con datos de peso y perímetro por perfil
 */
export function actualizarTablaPesoPDF(datosPeso) {
  const tbody = document.getElementById('pdf-peso-tabla-body');
  if (!tbody) return;

  if (!datosPeso || datosPeso.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #9ca3af;">No hay datos de peso</td></tr>';
    return;
  }

  let html = '';
  datosPeso.forEach(item => {
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

/**
 * Actualiza los totales de peso y perímetros
 * @param {object} totales - Objeto con pesoTotal y perimetroTotal
 */
export function actualizarTotalesPesoPDF(totales) {
  const contenedor = document.getElementById('pdf-peso-totales');
  if (!contenedor) return;

  if (!totales) {
    contenedor.innerHTML = '';
    return;
  }

  const html = `
    <div class="pdf-totales-row pdf-totales-total">
      <span>Peso total estructura</span>
      <span>${totales.pesoTotal !== undefined ? totales.pesoTotal.toFixed(2) : '0.00'} kg</span>
    </div>
    <div class="pdf-totales-row">
      <span>Perímetro total</span>
      <span>${totales.perimetroTotal !== undefined ? totales.perimetroTotal.toFixed(0) : '0'} mm</span>
    </div>
  `;

  contenedor.innerHTML = html;
}

// ============================================================================
// FUNCIÓN DE INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa los documentos PDF con valores por defecto
 */
export function inicializarDocumentosPDF() {
  actualizarFechaPDF();
  console.log('✅ Documentos PDF inicializados');
}
