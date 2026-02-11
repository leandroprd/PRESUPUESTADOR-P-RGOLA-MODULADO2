/**
 * GESTIÓN DE INFORMES ECONÓMICOS
 * =================================================================
 * Este módulo contiene las funciones relacionadas con:
 * - Cálculo de informes de material, peso/perímetro y hoja de corte
 * - Renderizado de los 3 tipos de documentos
 * - Gestión de datos para visualización y exportación
 */

// Importar constantes y funciones necesarias
import { 
  precio_perfiles, 
  precio_accesorios, 
  TIPO_MATERIAL,
  MARGEN_PUNTA_MM,
  MERMA_CORTE_MM
} from './config.js';

import { 
  DESCRIPCIONES
} from './calculosPergola.js';

import { 
  elegirAcabado,
  elegirReferenciaAcabado,
  leerConfigColores,
  leerReferenciasAcabado,
  precioFormatearEuro
} from './utils.js';

import {
  generarPiezasPerfiles,
  optimizarBarras,
  calcularPrecios
} from './precios.js';

// ============================================================================
// VARIABLE GLOBAL PARA ALMACENAR EL ÚLTIMO INFORME
// ============================================================================

let ultimoInforme = null;

// ============================================================================
// FUNCIÓN PRINCIPAL DE CÁLCULO DE INFORMES
// ============================================================================

/**
 * Calcula todos los datos necesarios para los 3 informes
 * @param {object} materiales - Materiales necesarios
 * @param {object} ctx - Contexto con dimensiones
 * @returns {object} Objeto con todos los datos de los informes
 */
export function calcularInformesEconomicos(materiales, ctx) {
  if (!materiales || !Object.keys(materiales).length || !ctx) {
    ultimoInforme = null;
    return null;
  }

  const config = leerConfigColores();
  const refs = leerReferenciasAcabado();
  
  // Calcular precios completos (SIN aplicar descuentos)
  const configSinDescuento = { ...config, descuento: 0 };
  const precios = calcularPrecios(materiales, ctx, configSinDescuento);
  
  if (!precios) {
    ultimoInforme = null;
    return null;
  }

  // Generar piezas por perfil para optimización
  const piezasPerfiles = generarPiezasPerfiles(materiales, ctx);

  // Preparar datos para informe de material
  const detalleMaterial = prepararDetalleMaterial(
    materiales, 
    piezasPerfiles, 
    precios, 
    config, 
    refs
  );

  // Preparar datos para peso y perímetro
  const detallePesoPerimetro = prepararDetallePesoPerimetro(
    piezasPerfiles,
    config
  );

  // Preparar datos para hoja de corte
  const detalleHojaCorte = prepararDetalleHojaCorte(
    piezasPerfiles,
    config
  );

  // Calcular totales
  const totales = calcularTotales(detalleMaterial, detallePesoPerimetro);

  ultimoInforme = {
    detalleMaterial,
    detallePesoPerimetro,
    detalleHojaCorte,
    totales,
    timestamp: new Date()
  };

  return ultimoInforme;
}

// ============================================================================
// FUNCIONES DE PREPARACIÓN DE DATOS
// ============================================================================

/**
 * Prepara el detalle para el informe de material
 */
function prepararDetalleMaterial(materiales, piezasPerfiles, precios, config, refs) {
  const detalle = [];

  Object.entries(materiales).forEach(([ref, cantidad]) => {
    if (cantidad <= 0) return;

    const tipo = TIPO_MATERIAL[ref] || "accesorio";
    const esPerfil = tipo === "perfil";

    if (esPerfil) {
      // Es un perfil de aluminio
      const perfil = precio_perfiles[ref] || {
        nombre: DESCRIPCIONES[ref] || ref,
        grupo_color: "perimetro",
        precio_m: {},
        longitudes_barra: []
      };

      const acabado = elegirAcabado(perfil.grupo_color, config);
      const refAcabado = elegirReferenciaAcabado(perfil.grupo_color, refs);
      const precioM = perfil.precio_m?.[acabado] || 0;

      // Optimizar barras
      const piezas = piezasPerfiles[ref] || [];
      const opt = optimizarBarras(ref, piezas);

      // Calcular barras totales y precio
      let totalBarras = 0;
      let longitudesBarraStr = "";
      let importe = 0;

      if (Object.keys(opt.barrasPorLongitud).length > 0) {
        const longitudesInfo = [];
        Object.entries(opt.barrasPorLongitud).forEach(([longMm, cant]) => {
          totalBarras += cant;
          const longM = Number(longMm) / 1000;
          // CAMBIO 1: Solo longitud en metros, limpia y sin información de cantidad
          longitudesInfo.push(`${longM.toFixed(1).replace('.', ',')} m`);
          importe += longM * cant * precioM;
        });
        longitudesBarraStr = longitudesInfo.join(" / ");
      } else {
        longitudesBarraStr = "—";
      }

      detalle.push({
        tipo: "Perfil",
        ref,
        descripcion: perfil.nombre,
        acabado: acabado.charAt(0).toUpperCase() + acabado.slice(1),
        refAcabado,
        longitudBarra: longitudesBarraStr,
        numBarras: totalBarras > 0 ? totalBarras : "—",
        precioUnitario: precioM > 0 ? precioM.toFixed(2).replace('.', ',') : "—",
        importe,
        esFabrica: opt.esFabrica
      });

    } else {
      // Es un accesorio
      const accesorio = precio_accesorios[ref] || {
        nombre: DESCRIPCIONES[ref] || ref,
        grupo_color: "neutro",
        precios: { sa: 0 }
      };

      const acabado = elegirAcabado(accesorio.grupo_color, config);
      const refAcabado = elegirReferenciaAcabado(accesorio.grupo_color, refs);
      const precioUnit = accesorio.precios?.[acabado] ?? accesorio.precios?.sa ?? 0;
      const importe = precioUnit * cantidad;

      detalle.push({
        tipo: "Accesorio",
        ref,
        descripcion: accesorio.nombre,
        acabado: acabado === "sa" ? "S/A" : acabado.charAt(0).toUpperCase() + acabado.slice(1),
        refAcabado,
        longitudBarra: "—",
        numBarras: cantidad,
        precioUnitario: precioUnit > 0 ? precioUnit.toFixed(2).replace('.', ',') : "—",
        importe
      });
    }
  });

  return detalle;
}

/**
 * Prepara el detalle para el informe de peso y perímetro
 */
function prepararDetallePesoPerimetro(piezasPerfiles, config) {
  const detalle = [];

  Object.entries(piezasPerfiles).forEach(([ref, piezas]) => {
    const perfil = precio_perfiles[ref];
    if (!perfil) return;

    const acabado = elegirAcabado(perfil.grupo_color, config);
    
    // Calcular longitud total en metros
    const longitudTotalM = piezas.reduce((sum, piezaMm) => sum + piezaMm, 0) / 1000;

    // Calcular peso y perímetro totales
    const pesoTotal = longitudTotalM * (perfil.peso_kg_m || 0);
    const perimetroTotal = longitudTotalM * (perfil.perimetro_total_mm || 0);

    detalle.push({
      ref,
      descripcion: perfil.nombre,
      acabado: acabado.charAt(0).toUpperCase() + acabado.slice(1),
      pesoTotal,
      perimetroTotal
    });
  });

  return detalle;
}

/**
 * Prepara el detalle para la hoja de corte
 */
function prepararDetalleHojaCorte(piezasPerfiles, config) {
  const detalle = [];

  Object.entries(piezasPerfiles).forEach(([ref, piezas]) => {
    const perfil = precio_perfiles[ref];
    if (!perfil || !piezas || piezas.length === 0) return;

    const acabado = elegirAcabado(perfil.grupo_color, config);
    
    // Optimizar barras (AHORA incluye barrasDetalle)
    const opt = optimizarBarras(ref, piezas);

    detalle.push({
      ref,
      descripcion: perfil.nombre,
      acabado: acabado.charAt(0).toUpperCase() + acabado.slice(1),
      barrasPorLongitud: opt.barrasPorLongitud,
      desperdicioTotal: opt.desperdicioTotal,
      barrasDetalle: opt.barrasDetalle,
      esFabrica: opt.esFabrica
    });
  });

  return detalle;
}

/**
 * Calcula los totales generales
 */
function calcularTotales(detalleMaterial, detallePesoPerimetro) {
  let subtotalAluminio = 0;
  let subtotalAccesorios = 0;
  let pesoTotal = 0;
  let perimetroTotal = 0;

  // Sumar importes de material
  detalleMaterial.forEach(item => {
    if (item.tipo === "Perfil") {
      subtotalAluminio += item.importe;
    } else {
      subtotalAccesorios += item.importe;
    }
  });

  // Sumar peso y perímetro
  detallePesoPerimetro.forEach(item => {
    pesoTotal += item.pesoTotal;
    perimetroTotal += item.perimetroTotal;
  });

  return {
    subtotalAluminio,
    subtotalAccesorios,
    totalGeneral: subtotalAluminio + subtotalAccesorios,
    pesoTotal,
    perimetroTotal
  };
}

// ============================================================================
// FUNCIONES DE RENDERIZADO
// ============================================================================

/**
 * Función principal de renderizado de informes
 * @param {object} informes - Datos de los informes calculados
 */
export function renderInformesEconomicos(informes) {
  if (!informes) {
    limpiarInformesEconomicos();
    return;
  }

  renderInformeMaterial(informes);
  renderInformePesoPerimetro(informes);
  renderInformeHojaCorte(informes);
}

/**
 * Renderiza el informe de material
 */
function renderInformeMaterial(informes) {
  const tbody = document.getElementById('doc-material-body');
  const totalesDiv = document.getElementById('doc-material-totales');

  if (!tbody || !totalesDiv) return;

  tbody.innerHTML = '';

  let hayPerfilesFabrica = false;

  informes.detalleMaterial.forEach(item => {
    const tr = document.createElement('tr');
    if (item.esFabrica) {
      hayPerfilesFabrica = true;
    }
    tr.innerHTML = `
      <td>${item.tipo}</td>
      <td style="font-family: monospace;">${item.ref}</td>
      <td>${item.esFabrica ? '⚠️ ' : ''}${item.descripcion}${item.esFabrica ? ' <span style="color:#b45309;font-size:0.8em;font-weight:600;">[FÁBRICA]</span>' : ''}</td>
      <td>${item.acabado}</td>
      <td style="font-family: monospace;">${item.refAcabado}</td>
      <td>${item.longitudBarra}</td>
      <td style="text-align: center;">${item.numBarras}</td>
      <td style="text-align: right;">${item.precioUnitario}</td>
      <td style="text-align: right; font-weight: 600;">${precioFormatearEuro(item.importe)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Nota al pie si hay perfiles de fábrica
  if (hayPerfilesFabrica) {
    const trNota = document.createElement('tr');
    trNota.innerHTML = `
      <td colspan="9" style="
        color: #92400e;
        font-size: 0.85em;
        padding: 0.6rem 0.75rem;
        font-style: italic;
      ">
        ⚠️ Los perfiles marcados como <strong>[FÁBRICA]</strong> superan la medida máxima de almacenamiento y deben pedirse a fábrica con medida especial.
      </td>
    `;
    tbody.appendChild(trNota);
  }

  // Renderizar totales
  totalesDiv.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; max-width: 500px; margin-left: auto;">
      <div style="text-align: right; font-weight: 500;">Subtotal Aluminio:</div>
      <div style="text-align: right; font-weight: 600; color: var(--blue-main);">${precioFormatearEuro(informes.totales.subtotalAluminio)}</div>
      
      <div style="text-align: right; font-weight: 500;">Subtotal Accesorios:</div>
      <div style="text-align: right; font-weight: 600; color: var(--blue-main);">${precioFormatearEuro(informes.totales.subtotalAccesorios)}</div>
      
      <div style="text-align: right; font-weight: 700; font-size: 1.1rem; border-top: 2px solid var(--border); padding-top: 0.5rem; margin-top: 0.5rem;">TOTAL GENERAL:</div>
      <div style="text-align: right; font-weight: 700; font-size: 1.1rem; color: var(--blue-dark); border-top: 2px solid var(--border); padding-top: 0.5rem; margin-top: 0.5rem;">${precioFormatearEuro(informes.totales.totalGeneral)}</div>
    </div>
  `;
}

/**
 * Renderiza el informe de peso y perímetro
 */
function renderInformePesoPerimetro(informes) {
  const tbody = document.getElementById('doc-peso-body');
  
  if (!tbody) return;

  tbody.innerHTML = '';

  informes.detallePesoPerimetro.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family: monospace;">${item.ref}</td>
      <td>${item.descripcion}</td>
      <td style="text-align: right; font-weight: 600;">${item.pesoTotal.toFixed(2)} kg</td>
      <td style="text-align: right; font-weight: 600;">${item.perimetroTotal.toFixed(2)} mm</td>
    `;
    tbody.appendChild(tr);
  });

  // Agregar fila de totales
  const trTotal = document.createElement('tr');
  trTotal.style.borderTop = '2px solid var(--border)';
  trTotal.style.fontWeight = '700';
  trTotal.style.backgroundColor = 'var(--blue-soft)';
  trTotal.innerHTML = `
    <td colspan="2" style="text-align: right; padding-right: 1rem;">TOTALES:</td>
    <td style="text-align: right; color: var(--blue-dark);">${informes.totales.pesoTotal.toFixed(2)} kg</td>
    <td style="text-align: right; color: var(--blue-dark);">${informes.totales.perimetroTotal.toFixed(2)} mm</td>
  `;
  tbody.appendChild(trTotal);
}

/**
 * Renderiza la hoja de corte
 */
function renderInformeHojaCorte(informes) {
  const container = document.getElementById('doc-corte-body');
  
  if (!container) return;

  container.innerHTML = '';

  informes.detalleHojaCorte.forEach(perfil => {
    // Crear sección por perfil
    const section = document.createElement('div');
    section.style.marginBottom = '2rem';
    section.style.pageBreakInside = 'avoid';

    // Encabezado del perfil
    const header = document.createElement('div');
    header.style.marginBottom = '1rem';
    header.style.padding = '0.75rem';
    header.style.backgroundColor = 'var(--blue-soft)';
    header.style.borderRadius = '0.5rem';
    header.innerHTML = `
      <div style="font-weight: 700; font-size: 1.05rem; color: var(--blue-dark); margin-bottom: 0.25rem;">
        ${perfil.esFabrica ? '⚠️ ' : ''}${perfil.ref} - ${perfil.descripcion}
        ${perfil.esFabrica ? '<span style="margin-left:0.5rem;font-size:0.8em;background:#fde68a;color:#92400e;padding:0.1em 0.5em;border-radius:4px;">PEDIDO A FÁBRICA</span>' : ''}
      </div>
      <div style="font-size: 0.9rem; color: var(--text-soft);">
        Acabado: ${perfil.acabado} | Desperdicio total: ${(perfil.desperdicioTotal / 1000).toFixed(3)} m
      </div>
    `;
    section.appendChild(header);

    // Tabla de barras
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.fontSize = '0.9rem';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th style="width: 15%;">Barra (mm)</th>
        <th style="width: 10%;">Cantidad</th>
        <th style="width: 55%;">Piezas cortadas (mm)</th>
        <th style="width: 20%;">Desperdicio (mm)</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    // Agrupar barras por patrón de corte (longitud + piezas)
    const patronesCorte = {};
    
    perfil.barrasDetalle.forEach(barra => {
      // Crear clave única: longitud + patrón de piezas
      const piezasOrdenadas = [...barra.piezas].sort((a, b) => b - a);
      const patronKey = `${barra.longitud}|${piezasOrdenadas.join(',')}`; 
      
      if (!patronesCorte[patronKey]) {
        patronesCorte[patronKey] = {
          longitud: barra.longitud,
          piezas: barra.piezas,
          desperdicio: barra.desperdicio,
          cantidad: 0
        };
      }
      patronesCorte[patronKey].cantidad++;
    });

    // Renderizar cada patrón único
    Object.values(patronesCorte).forEach((patron) => {
      const tr = document.createElement('tr');
      
      // Longitud de barra
      const tdLong = document.createElement('td');
      tdLong.style.fontWeight = '600';
      tdLong.style.fontFamily = 'monospace';
      tdLong.textContent = patron.longitud;
      tr.appendChild(tdLong);

      // Cantidad
      const tdCant = document.createElement('td');
      tdCant.style.textAlign = 'center';
      tdCant.style.fontWeight = '600';
      tdCant.textContent = patron.cantidad;
      tr.appendChild(tdCant);

      // Piezas cortadas
      const tdPiezas = document.createElement('td');
      tdPiezas.style.fontFamily = 'monospace';
      tdPiezas.style.fontSize = '0.85rem';
      const piezasStr = patron.piezas.map(p => p.toFixed(0)).join(' + ');
      tdPiezas.textContent = piezasStr;
      tr.appendChild(tdPiezas);

      // Desperdicio
      const tdDesp = document.createElement('td');
      tdDesp.style.textAlign = 'right';
      tdDesp.style.fontFamily = 'monospace';
      tdDesp.textContent = patron.desperdicio.toFixed(1);
      tr.appendChild(tdDesp);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    container.appendChild(section);
  });
}

/**
 * Limpia todos los contenedores de informes
 */
export function limpiarInformesEconomicos() {
  const docMaterialBody = document.getElementById('doc-material-body');
  const docMaterialTotales = document.getElementById('doc-material-totales');
  const docPesoBody = document.getElementById('doc-peso-body');
  const docCorteBody = document.getElementById('doc-corte-body');

  if (docMaterialBody) docMaterialBody.innerHTML = '';
  if (docMaterialTotales) docMaterialTotales.innerHTML = '';
  if (docPesoBody) docPesoBody.innerHTML = '';
  if (docCorteBody) docCorteBody.innerHTML = '';

  ultimoInforme = null;
}

// ============================================================================
// FUNCIONES AUXILIARES DE ACCESO A DATOS
// ============================================================================

/**
 * Obtiene el último informe calculado
 * @returns {object|null} Último informe
 */
export function obtenerUltimoInforme() {
  return ultimoInforme;
}

/**
 * Obtiene el resumen de líneas del informe de material
 * @returns {Array} Array con el detalle de material
 */
export function obtenerResumenLineas() {
  return ultimoInforme ? ultimoInforme.detalleMaterial : [];
}

/**
 * Obtiene los totales del informe
 * @returns {object|null} Objeto con totales
 */
export function obtenerTotales() {
  return ultimoInforme ? ultimoInforme.totales : null;
}

/**
 * Obtiene el detalle de perfiles (peso y perímetro)
 * @returns {Array} Array con detalle de perfiles
 */
export function obtenerDetallePerfiles() {
  return ultimoInforme ? ultimoInforme.detallePesoPerimetro : [];
}

/**
 * Obtiene el detalle de accesorios
 * @returns {Array} Array con detalle de accesorios
 */
export function obtenerDetalleAccesorios() {
  if (!ultimoInforme) return [];
  return ultimoInforme.detalleMaterial.filter(item => item.tipo === "Accesorio");
}