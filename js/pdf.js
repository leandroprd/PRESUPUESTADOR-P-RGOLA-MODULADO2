/**
 * MÓDULO DE GENERACIÓN DE PDFs
 * =================================================================
 * Este módulo gestiona la generación de los 3 documentos PDF:
 * 1. PRESUPUESTO - Documento comercial completo
 * 2. HOJA DE CORTE - Documento de fabricación con patrones
 * 3. PESO Y PERÍMETROS - Documento técnico sin precios
 * 
 * Arquitectura:
 * - 1 plantilla base corporativa reutilizable
 * - Contenedor oculto para generación
 * - Datos consumidos de informesEconomicosUltimo
 * - NO recalcula nada, solo renderiza
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

import { 
  obtenerUltimoInforme,
  obtenerTotales 
} from './informes.js';

import {
  generarFechaFormateada,
  generarCodigoRef,
  precioFormatearEuro,
  leerConfigColores
} from './utils.js';

import { VERSION } from './config.js';

// ============================================================================
// CONSTANTES DEL MÓDULO
// ============================================================================

const PDF_ROOT_ID = 'pdfRootContainer';
const LOGO_PATH = './assets/logo-galisur.png'; // Ajustar según ubicación real

// ============================================================================
// FUNCIÓN DE INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa el sistema de PDFs
 * Crea el contenedor oculto y configura eventos
 */
export function inicializarSistemaPDF() {
  // Crear contenedor oculto si no existe
  if (!document.getElementById(PDF_ROOT_ID)) {
    const container = document.createElement('div');
    container.id = PDF_ROOT_ID;
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 794px;
      background: white;
      padding: 24px;
      box-sizing: border-box;
    `;
    document.body.appendChild(container);
  }

  // Configurar el botón de generar PDF
  const btnGenerarPDF = document.getElementById('btnGenerarPDF');
  if (btnGenerarPDF) {
    btnGenerarPDF.addEventListener('click', generarPdfDocumento);
  }
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE GENERACIÓN
// ============================================================================

/**
 * Genera el PDF del documento seleccionado
 */
export function generarPdfDocumento() {
  // Obtener el tipo de documento seleccionado
  const selector = document.getElementById('selectorDocumento');
  if (!selector) {
    console.error('No se encuentra el selector de documento');
    return;
  }

  const tipoDocumento = selector.value; // "material", "peso", "corte"

  // Obtener datos del último informe
  const informe = obtenerUltimoInforme();
  if (!informe) {
    alert('No hay datos calculados. Por favor, calcula primero la configuración.');
    return;
  }

  // Obtener datos de contexto
  const datosContexto = leerDatosContexto();
  if (!datosContexto) {
    alert('Faltan datos de configuración. Por favor, completa todos los campos.');
    return;
  }

  // Generar el PDF según el tipo de documento
  try {
    switch (tipoDocumento) {
      case 'material':
        generarPdfPresupuesto(informe, datosContexto);
        break;
      case 'corte':
        generarPdfHojaCorte(informe, datosContexto);
        break;
      case 'peso':
        generarPdfPesoPerimetros(informe, datosContexto);
        break;
      default:
        console.error('Tipo de documento no reconocido:', tipoDocumento);
    }
  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Error al generar el PDF. Revisa la consola para más detalles.');
  }
}

// ============================================================================
// FUNCIONES DE LECTURA DE DATOS DEL DOM
// ============================================================================

/**
 * Lee todos los datos de contexto necesarios desde el DOM
 */
function leerDatosContexto() {
  // Datos de cabecera
  const comercial = document.getElementById('inputComercial')?.value || '';
  const cliente = document.getElementById('inputCliente')?.value || '';
  const refObra = document.getElementById('inputRefObra')?.value || '';
  
  // Datos geométricos
  const ancho = parseFloat(document.getElementById('ancho')?.value) || 0;
  const salida = parseFloat(document.getElementById('salida')?.value) || 0;
  const altura = parseFloat(document.getElementById('altura')?.value) || 0;
  
  // Número de módulos
  const variosModulos = document.getElementById('variosModulos')?.checked || false;
  const modulos = variosModulos 
    ? parseInt(document.getElementById('numModulos')?.value, 10) || 1 
    : 1;
  
  // Tipo de montaje
  const tipoMontaje = document.getElementById('tipoMontaje')?.value || 'pilares';
  const tipoMontajeTexto = document.getElementById('tipoMontaje')?.selectedOptions[0]?.text || '';
  
  // Número de pilares calculados (desde el DOM)
  const numPilaresText = document.getElementById('numPilaresCalc')?.textContent || '0';
  const numPilares = parseInt(numPilaresText, 10) || 0;
  
  // Motor
  const modoMotor = document.querySelector('input[name="modoMotor"]:checked')?.value || 'todos-izquierda';
  const modoMotorTexto = modoMotor === 'todos-izquierda' ? 'Todos a izquierda' 
    : modoMotor === 'todos-derecha' ? 'Todos a derecha' 
    : 'Personalizado';
  
  // Número de lamas (desde el DOM)
  const numLamasText = document.getElementById('numLamasDisplay')?.textContent || '0';
  const numLamas = parseInt(numLamasText, 10) || 0;
  
  // Mando
  const mando = document.getElementById('mando')?.value || 'con';
  const mandoTexto = mando === 'con' ? 'Con mando (1 ud.)' : 'Sin mando';
  
  // Colores
  const config = leerConfigColores();
  
  // Código y fecha
  const codigoPresupuesto = generarCodigoRef();
  const fecha = generarFechaFormateada();

  return {
    comercial,
    cliente,
    refObra,
    ancho,
    salida,
    altura,
    modulos,
    tipoMontaje,
    tipoMontajeTexto,
    numPilares,
    modoMotor,
    modoMotorTexto,
    numLamas,
    mando,
    mandoTexto,
    config,
    codigoPresupuesto,
    fecha
  };
}

// ============================================================================
// GENERACIÓN DE ESTRUCTURA BASE (REUTILIZABLE)
// ============================================================================

/**
 * Genera la estructura base del PDF (cabecera + datos obra)
 */
function generarEstructuraBase(datos, tipoDocumento) {
  const tituloDocumento = tipoDocumento === 'presupuesto' 
    ? 'PRESUPUESTO PÉRGOLA BIOCLIMÁTICA' 
    : tipoDocumento === 'corte' 
    ? 'HOJA DE CORTE · FABRICACIÓN'
    : 'PESO Y PERÍMETROS · DOCUMENTO TÉCNICO';

  return `
    <!-- Cabecera corporativa -->
    <header class="pdf-header">
      <div class="pdf-header-left">
        <div class="pdf-header-text">
          <div class="pdf-empresa">ALUMINIOS GALISUR</div>
          <div class="pdf-subtitulo">${tituloDocumento} · DOHA SUN</div>
        </div>
      </div>
      <div class="pdf-header-right">
        <div class="pdf-fecha">${datos.fecha}</div>
      </div>
    </header>

    <hr class="pdf-divider">

    <!-- Datos de obra -->
    <section class="pdf-section pdf-datos-obra">
      <div class="pdf-resumen-header">
        <div>
          <h1 class="pdf-section-title">Datos de la obra</h1>
          <div class="pdf-ref">
            Ref. presupuesto: <span class="pdf-ref-code">${datos.codigoPresupuesto}</span>
          </div>
        </div>
        <div class="pdf-pill">${tipoDocumento.toUpperCase()}</div>
      </div>

      <div class="pdf-resumen-meta">
        ${datos.comercial ? `<div><strong>Comercial:</strong> ${datos.comercial}</div>` : ''}
        ${datos.cliente ? `<div><strong>Cliente:</strong> ${datos.cliente}</div>` : ''}
        ${datos.refObra ? `<div><strong>Ref. obra:</strong> ${datos.refObra}</div>` : ''}
      </div>

      <div class="pdf-resumen-card">
        <div class="pdf-resumen-card-title">Configuración principal</div>
        <ul class="pdf-resumen-list">
          <li><strong>Largo/salida:</strong> ${datos.salida.toFixed(2)} m · <strong>Ancho:</strong> ${datos.ancho.toFixed(2)} m · <strong>Altura libre:</strong> ${datos.altura.toFixed(2)} m</li>
          <li><strong>Módulos:</strong> ${datos.modulos}</li>
          <li><strong>Tipo de montaje:</strong> ${datos.tipoMontajeTexto}</li>
          <li><strong>Nº pilares:</strong> ${datos.numPilares}</li>
          <li><strong>Motores:</strong> ${datos.modoMotorTexto}</li>
          <li><strong>Número de lamas:</strong> ${datos.numLamas}</li>
          <li><strong>Mando:</strong> ${datos.mandoTexto}</li>
        </ul>
      </div>
    </section>
  `;
}

// ============================================================================
// DOCUMENTO 1: PRESUPUESTO
// ============================================================================

/**
 * Genera el PDF del presupuesto completo
 */
function generarPdfPresupuesto(informe, datosContexto) {
  const container = document.getElementById(PDF_ROOT_ID);
  if (!container) return;

  const totales = obtenerTotales();
  if (!totales) return;

  // Construir HTML del documento
  let htmlContenido = generarEstructuraBase(datosContexto, 'presupuesto');

  // SVG del esquema (si está disponible)
  const svgContainer = document.getElementById('svg-container');
  if (svgContainer && svgContainer.innerHTML.trim()) {
    htmlContenido += `
      <section class="pdf-section pdf-esquema">
        <h2 class="pdf-section-title">Vista esquemática</h2>
        <div class="pdf-imagen-wrapper">
          ${svgContainer.innerHTML}
        </div>
      </section>
    `;
  }

  // Tabla de materiales
  htmlContenido += `
    <section class="pdf-section pdf-presupuesto-tabla">
      <h2 class="pdf-section-title">Detalle de materiales</h2>
      <table class="pdf-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Ref.</th>
            <th>Descripción</th>
            <th>Acabado</th>
            <th style="text-align:right;">Long. barra</th>
            <th style="text-align:right;">Nº barras/uds</th>
            <th style="text-align:right;">Precio unit.</th>
            <th style="text-align:right;">Importe</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Añadir filas de la tabla
  informe.detalleMaterial.forEach(item => {
    htmlContenido += `
      <tr>
        <td>${item.tipo}</td>
        <td>${item.ref}</td>
        <td>${item.descripcion}</td>
        <td>${item.acabado}</td>
        <td style="text-align:right;">${item.longitudBarra}</td>
        <td style="text-align:right;">${item.numBarras}</td>
        <td style="text-align:right;">${item.precioUnitario}</td>
        <td style="text-align:right;">${precioFormatearEuro(item.importe)}</td>
      </tr>
    `;
  });

  htmlContenido += `
        </tbody>
      </table>

      <!-- Totales -->
      <div class="pdf-totales">
        <div class="pdf-totales-row">
          <span>Subtotal aluminio</span>
          <span>${precioFormatearEuro(totales.subtotalAluminio)}</span>
        </div>
        <div class="pdf-totales-row">
          <span>Subtotal accesorios</span>
          <span>${precioFormatearEuro(totales.subtotalAccesorios)}</span>
        </div>
        <div class="pdf-totales-row pdf-totales-total">
          <span>Total presupuesto</span>
          <span>${precioFormatearEuro(totales.totalGeneral)}</span>
        </div>
      </div>
    </section>
  `;

  // Insertar en el contenedor
  container.innerHTML = htmlContenido;

  // Generar PDF
  exportarAPdf(container, `PRESUPUESTO_${datosContexto.codigoPresupuesto}.pdf`);
}

// ============================================================================
// DOCUMENTO 2: HOJA DE CORTE
// ============================================================================

/**
 * Genera el PDF de la hoja de corte
 */
function generarPdfHojaCorte(informe, datosContexto) {
  const container = document.getElementById(PDF_ROOT_ID);
  if (!container) return;

  // Construir HTML del documento
  let htmlContenido = generarEstructuraBase(datosContexto, 'corte');

  htmlContenido += `
    <section class="pdf-section pdf-hoja-corte">
      <h2 class="pdf-section-title">Patrones de corte por perfil</h2>
  `;

  // Para cada perfil, mostrar su detalle de barras
  informe.detalleHojaCorte.forEach(perfilData => {
    htmlContenido += `
      <div class="pdf-perfil-corte" style="margin-bottom: 1rem; page-break-inside: avoid;">
        <h3 style="font-size: 11px; font-weight: 700; margin: 0.5rem 0 0.25rem; color: #1f2937;">
          ${perfilData.ref} - ${perfilData.descripcion}
        </h3>
        <p style="font-size: 9px; margin: 0 0 0.4rem; color: #6b7280;">
          Acabado: ${perfilData.acabado}
        </p>
    `;

    // Para cada barra
    perfilData.barras.forEach((barra, idx) => {
      const piezasStr = barra.piezas.map(p => `${p}mm`).join(', ');
      const sumaPiezas = barra.piezas.reduce((sum, p) => sum + p, 0);
      
      htmlContenido += `
        <div style="font-size: 9px; padding: 0.3rem 0.5rem; border: 1px solid #e5e7eb; border-radius: 4px; margin-bottom: 0.25rem; background: #f9fafb;">
          <strong>Barra ${idx + 1}:</strong> ${(barra.longitud / 1000).toFixed(1)}m → 
          <strong>${barra.piezas.length} piezas:</strong> ${piezasStr} 
          · <strong>Desperdicio:</strong> ${barra.desperdicio.toFixed(0)}mm
        </div>
      `;
    });

    htmlContenido += `
        <p style="font-size: 9px; margin: 0.4rem 0 0; font-weight: 600;">
          Total: ${perfilData.totalBarras} barras · ${perfilData.totalPiezas} piezas
        </p>
      </div>
    `;
  });

  htmlContenido += `
    </section>
  `;

  // Insertar en el contenedor
  container.innerHTML = htmlContenido;

  // Generar PDF
  exportarAPdf(container, `HOJA_CORTE_${datosContexto.codigoPresupuesto}.pdf`);
}

// ============================================================================
// DOCUMENTO 3: PESO Y PERÍMETROS
// ============================================================================

/**
 * Genera el PDF de peso y perímetros
 */
function generarPdfPesoPerimetros(informe, datosContexto) {
  const container = document.getElementById(PDF_ROOT_ID);
  if (!container) return;

  const totales = obtenerTotales();
  if (!totales) return;

  // Construir HTML del documento
  let htmlContenido = generarEstructuraBase(datosContexto, 'peso');

  htmlContenido += `
    <section class="pdf-section pdf-peso-perimetros">
      <h2 class="pdf-section-title">Peso y perímetros por perfil</h2>
      <table class="pdf-table">
        <thead>
          <tr>
            <th>Ref.</th>
            <th>Descripción</th>
            <th>Acabado</th>
            <th style="text-align:right;">Peso total (kg)</th>
            <th style="text-align:right;">Perímetro total (mm)</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Añadir filas
  informe.detallePesoPerimetro.forEach(item => {
    htmlContenido += `
      <tr>
        <td>${item.ref}</td>
        <td>${item.descripcion}</td>
        <td>${item.acabado}</td>
        <td style="text-align:right;">${item.pesoTotal.toFixed(2)}</td>
        <td style="text-align:right;">${item.perimetroTotal.toFixed(0)}</td>
      </tr>
    `;
  });

  htmlContenido += `
        </tbody>
      </table>

      <!-- Totales -->
      <div class="pdf-totales">
        <div class="pdf-totales-row pdf-totales-total">
          <span>Peso total estructura</span>
          <span>${totales.pesoTotal.toFixed(2)} kg</span>
        </div>
        <div class="pdf-totales-row">
          <span>Perímetro total</span>
          <span>${totales.perimetroTotal.toFixed(0)} mm</span>
        </div>
      </div>
    </section>
  `;

  // Insertar en el contenedor
  container.innerHTML = htmlContenido;

  // Generar PDF
  exportarAPdf(container, `PESO_PERIMETROS_${datosContexto.codigoPresupuesto}.pdf`);
}

// ============================================================================
// FUNCIÓN DE EXPORTACIÓN A PDF
// ============================================================================

/**
 * Exporta el contenedor a PDF usando html2pdf
 */
function exportarAPdf(elemento, nombreArchivo) {
  const opt = {
    margin: 0,
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

  // Usar html2pdf (debe estar cargado globalmente)
  if (typeof html2pdf === 'undefined') {
    console.error('html2pdf no está cargado. Asegúrate de incluir la librería.');
    alert('Error: Librería de PDF no encontrada.');
    return;
  }

  html2pdf()
    .from(elemento)
    .set(opt)
    .save()
    .then(() => {
      console.log('PDF generado correctamente:', nombreArchivo);
    })
    .catch(error => {
      console.error('Error al generar PDF:', error);
    });
}
