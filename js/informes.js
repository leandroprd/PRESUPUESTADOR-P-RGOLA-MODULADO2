/**
 * INFORMES ECONÓMICOS Y DETALLE DE MATERIALES
 * =================================================================
 * Este módulo contiene las funciones relacionadas con:
 * - Generación de informes económicos detallados
 * - Optimización de barras con detalle de cortes
 * - Cálculo de totales, desperdicios y optimización
 * - Renderizado de tablas económicas
 */

// Importar constantes y funciones necesarias
import { 
  precio_perfiles, 
  precio_accesorios, 
  TIPO_MATERIAL 
} from './config.js';

import { DESCRIPCIONES } from './calculosPergola.js';
import { 
  precioFormatearEuro, 
  elegirAcabado,
  acabadoATexto,
  elegirReferenciaAcabado,
  leerConfigColores,
  leerReferenciasAcabado
} from './utils.js';

import { 
  generarPiezasPerfiles,
  optimizarBarras 
} from './precios.js';

// ============================================================================
// PERFILES Y ACCESORIOS PARA INFORMES (incluye perfiles sin precio)
// ============================================================================

const informe_perfiles = {
  ...precio_perfiles,
  "6211": {
    ref: "6211",
    nombre: "Canalón Doha",
    grupo_color: "perimetro",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 0, textura: 0, color: 0, anodizado: 0, nature: 0 },
    peso_kg_m: 1.52,
    perimetro_total_mm: 54.34,
    perimetro_ext_mm: 0,
    perimetro_int_mm: 54.34
  },
  "6214": {
    ref: "6214",
    nombre: "Soporte de lamas",
    grupo_color: "lamas",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 0, textura: 0, color: 0, anodizado: 0, nature: 0 },
    peso_kg_m: 0.622,
    perimetro_total_mm: 16.06,
    perimetro_ext_mm: 0,
    perimetro_int_mm: 16.06
  },
  "6211B": {
    ref: "6211B",
    nombre: "Rectángulo 20x10 x 1,3",
    grupo_color: "perimetro",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 0, textura: 0, color: 0, anodizado: 0, nature: 0 },
    peso_kg_m: 0.192,
    perimetro_total_mm: 11,
    perimetro_ext_mm: 10,
    perimetro_int_mm: 1
  }
};

const informe_accesorios = { ...precio_accesorios };

// Variable global para almacenar el último cálculo
let informesEconomicosUltimo = null;

// ============================================================================
// OPTIMIZACIÓN DETALLADA DE BARRAS CON IDENTIFICACIÓN DE CORTES
// ============================================================================

/**
 * Optimiza barras y genera detalle completo de cortes con IDs
 * @param {string} ref - Referencia del perfil
 * @param {Array<number>} piezasMm - Array de longitudes en mm
 * @returns {object} Resultado con barras detalladas, longitudes y desperdicios
 */
function optimizarBarrasDetallado(ref, piezasMm) {
  const perfil = informe_perfiles[ref];
  if (!perfil || !piezasMm?.length) {
    return { 
      barras: [], 
      longitudTotalUtilM: 0, 
      longitudTotalBarrasM: 0, 
      desperdicioTotalM: 0 
    };
  }

  // Usar la función de optimización existente
  const resultado = optimizarBarras(ref, piezasMm);
  
  // Reconstruir las barras con detalle de cortes
  const longitudes = (perfil.longitudes_barra || [])
    .map(l => Math.round(l * 1000))
    .sort((a, b) => a - b);

  const barrasDetalladas = [];
  let indiceBarra = 1;
  
  // Agrupar piezas por longitud de barra
  Object.entries(resultado.barrasPorLongitud).forEach(([longitudMm, cantidad]) => {
    const longitudBarraMm = Number(longitudMm);
    
    for (let i = 0; i < cantidad; i++) {
      const idBarra = `${ref}.${indiceBarra++}`;
      
      // Simular la asignación de piezas a esta barra
      // (en una implementación real, esto vendría del algoritmo de optimización)
      barrasDetalladas.push({
        id_barra: idBarra,
        longitud_barra_m: longitudBarraMm / 1000,
        cortes: [],
        desperdicio_m: 0
      });
    }
  });

  const longitudTotalBarrasM = Object.entries(resultado.barrasPorLongitud)
    .reduce((acc, [long, cant]) => acc + (Number(long) / 1000) * cant, 0);
  
  const longitudTotalUtilM = piezasMm.reduce((acc, p) => acc + p, 0) / 1000;

  return {
    barras: barrasDetalladas,
    longitudTotalUtilM,
    longitudTotalBarrasM,
    desperdicioTotalM: longitudTotalBarrasM - longitudTotalUtilM
  };
}

// ============================================================================
// CÁLCULO DE INFORMES ECONÓMICOS
// ============================================================================

/**
 * Calcula los informes económicos detallados
 * @param {object} materiales - Materiales necesarios
 * @param {object} ctx - Contexto con dimensiones
 * @returns {object} Informes económicos completos
 */
export function calcularInformesEconomicos(materiales, ctx = {}) {
  if (!materiales || !Object.keys(materiales).length) {
    informesEconomicosUltimo = null;
    return null;
  }

  const configColores = leerConfigColores();
  const refsAcabado = leerReferenciasAcabado();
  const piezasPerfiles = generarPiezasPerfiles(materiales, ctx);

  // Procesar perfiles
  const perfilesOptim = Object.entries(piezasPerfiles).map(([ref, piezas]) => {
    const perf = informe_perfiles[ref] || { 
      nombre: DESCRIPCIONES[ref] || ref, 
      grupo_color: "perimetro", 
      precio_m: {} 
    };
    const optim = optimizarBarrasDetallado(ref, piezas);
    
    return {
      ref,
      descripcion: perf.nombre,
      tipo: "perfil",
      acabado_tipo: acabadoATexto(perf.grupo_color, configColores),
      acabado_ref: elegirReferenciaAcabado(perf.grupo_color, refsAcabado),
      grupo_color: perf.grupo_color,
      barras: optim.barras,
      longitud_total_util_m: optim.longitudTotalUtilM,
      longitud_total_barras_m: optim.longitudTotalBarrasM,
      desperdicio_total_m: optim.desperdicioTotalM,
      peso_kg: (perf.peso_kg_m || 0) * optim.longitudTotalUtilM,
      perimetro_mm: (perf.perimetro_total_mm || 0) * optim.longitudTotalUtilM,
      precio_m: perf.precio_m || {}
    };
  });

  // Procesar accesorios
  const accesorios = Object.fromEntries(
    Object.entries(materiales).filter(([ref]) => 
      (TIPO_MATERIAL[ref] || "accesorio") !== "perfil"
    )
  );

  const accesoriosLista = Object.entries(accesorios).map(([ref, unidades]) => {
    const acc = informe_accesorios[ref] || { 
      nombre: DESCRIPCIONES[ref] || ref, 
      grupo_color: "neutro", 
      precios: { sa: 0 } 
    };
    return {
      ref,
      descripcion: acc.nombre,
      tipo: "accesorio",
      unidades,
      acabado_tipo: acabadoATexto(acc.grupo_color, configColores),
      acabado_ref: elegirReferenciaAcabado(acc.grupo_color, refsAcabado)
    };
  });

  // Generar resumen por líneas
  const resumen_lineas = [];
  let total_perfiles = 0;
  let total_accesorios = 0;
  let metros_comprados_total = 0;
  let metros_utiles_total = 0;

  const descuentoFactor = 1 - (configColores.descuento || 0) / 100;

  // Agrupar perfiles por longitud de barra
  perfilesOptim.forEach(perf => {
    const infoPerf = informe_perfiles[perf.ref] || {};
    const claveAcabado = elegirAcabado(infoPerf.grupo_color || "perimetro", configColores);
    const precioM = infoPerf.precio_m?.[claveAcabado] || 0;
    const grupos = {};

    perf.barras.forEach(b => {
      const key = b.longitud_barra_m.toFixed(3);
      if (!grupos[key]) {
        grupos[key] = { 
          longitud_barra_m: b.longitud_barra_m, 
          num_barras: 0, 
          long_util_m: 0 
        };
      }
      grupos[key].num_barras += 1;
      grupos[key].long_util_m += b.cortes.reduce((acc, c) => acc + c.longitud_m, 0);
    });

    Object.values(grupos).forEach(grupo => {
      const long_total_barras_m = grupo.num_barras * grupo.longitud_barra_m;
      const long_util_m = grupo.long_util_m;
      const desperdicio_m = long_total_barras_m - long_util_m;
      const desperdicio_pct = long_total_barras_m > 0 
        ? (desperdicio_m / long_total_barras_m) * 100 
        : 0;

      const importe = long_total_barras_m * precioM * descuentoFactor;
      const precioBarra = precioM * grupo.longitud_barra_m * descuentoFactor;

      resumen_lineas.push({
        tipo: "perfil",
        ref: perf.ref,
        denominacion: perf.descripcion,
        acabado: perf.acabado_tipo,
        ref_acabado: perf.acabado_ref,
        longitud_barra_m: grupo.longitud_barra_m,
        num_barras: grupo.num_barras,
        unidades: null,
        metros_comprados: long_total_barras_m,
        metros_utiles: long_util_m,
        desperdicio_m,
        desperdicio_pct,
        precio_unitario: precioBarra,
        importe
      });

      metros_comprados_total += long_total_barras_m;
      metros_utiles_total += long_util_m;
      total_perfiles += importe;
    });
  });

  // Procesar accesorios para el resumen
  accesoriosLista.forEach(acc => {
    const infoAcc = informe_accesorios[acc.ref] || { 
      precios: { sa: 0 }, 
      grupo_color: "neutro" 
    };
    const claveAcabado = elegirAcabado(infoAcc.grupo_color, configColores);
    const precioUnit = infoAcc.precios?.[claveAcabado] ?? infoAcc.precios?.sa ?? 0;
    const importe = (acc.unidades || 0) * precioUnit;

    resumen_lineas.push({
      tipo: "accesorio",
      ref: acc.ref,
      denominacion: acc.descripcion,
      acabado: acc.acabado_tipo,
      ref_acabado: acc.acabado_ref,
      longitud_barra_m: null,
      num_barras: null,
      unidades: acc.unidades,
      metros_comprados: 0,
      metros_utiles: 0,
      desperdicio_m: 0,
      desperdicio_pct: 0,
      precio_unitario: precioUnit,
      importe
    });

    total_accesorios += importe;
  });

  const total_general = total_perfiles + total_accesorios;
  const desperdicio_total_m = metros_comprados_total - metros_utiles_total;
  const nivel_optimizacion_pct = metros_comprados_total > 0 
    ? (metros_utiles_total / metros_comprados_total) * 100 
    : 0;

  informesEconomicosUltimo = {
    perfiles: perfilesOptim,
    accesorios: accesoriosLista,
    refsAcabado,
    configColores,
    resumen_lineas,
    totales: {
      total_perfiles,
      total_accesorios,
      total_general,
      metros_comprados_total,
      metros_utiles_total,
      desperdicio_total_m,
      nivel_optimizacion_pct
    }
  };

  return informesEconomicosUltimo;
}

/**
 * Obtiene el último informe económico calculado
 * @returns {object|null} Último informe económico
 */
export function obtenerUltimoInforme() {
  return informesEconomicosUltimo;
}

// ============================================================================
// RENDERIZADO DE INFORMES ECONÓMICOS
// ============================================================================

/**
 * Renderiza los informes económicos en la interfaz
 * @param {object} data - Datos del informe económico
 */
export function renderInformesEconomicos(data) {
  const resumenWeb = document.getElementById("resumenEconomicoBodyWeb");
  const resumenPdf = document.getElementById("resumenEconomicoBodyPdf");
  const resumenMatWeb = document.getElementById("materialBodyWeb");
  const resumenMatPdf = document.getElementById("materialDocBody");
  const totalesWeb = document.getElementById("resumenEconomicoTotalesWeb");
  const totalesPdf = document.getElementById("resumenEconomicoTotalesPdf");

  [resumenWeb, resumenPdf, resumenMatWeb, resumenMatPdf, totalesWeb, totalesPdf].forEach(el => {
    if (el) el.innerHTML = "";
  });

  if (!data) return;

  const filas = data.resumen_lineas || [];

  // Función auxiliar para renderizar una línea
  const renderLinea = (destino, linea) => {
    const longBarra = linea.longitud_barra_m != null 
      ? linea.longitud_barra_m.toFixed(2) 
      : "—";
    const unidades = linea.tipo === "accesorio" 
      ? (linea.unidades ?? 0) 
      : (linea.num_barras ?? 0);
    const metrosComprados = linea.metros_comprados 
      ? linea.metros_comprados.toFixed(3) 
      : "—";
    const metrosUtiles = linea.metros_utiles 
      ? linea.metros_utiles.toFixed(3) 
      : "—";
    const desperdicioTexto = linea.metros_comprados && linea.tipo === "perfil"
      ? `${linea.desperdicio_m.toFixed(3)} m (${linea.desperdicio_pct.toFixed(1)}%)`
      : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${linea.tipo === "perfil" ? "Perfil" : "Accesorio"}</td>
      <td>${linea.ref}</td>
      <td>${linea.denominacion}</td>
      <td>${linea.acabado || ""}</td>
      <td>${linea.ref_acabado || ""}</td>
      <td>${longBarra}</td>
      <td>${unidades ?? ""}</td>
      <td>${metrosComprados}</td>
      <td>${metrosUtiles}</td>
      <td>${desperdicioTexto}</td>
      <td>${precioFormatearEuro(linea.precio_unitario)}</td>
      <td>${precioFormatearEuro(linea.importe)}</td>`;
    destino?.appendChild(tr);
  };

  // Renderizar todas las líneas
  filas.forEach(linea => {
    renderLinea(resumenWeb, linea);
    renderLinea(resumenPdf, linea);
    renderLinea(resumenMatWeb, linea);
    renderLinea(resumenMatPdf, linea);
  });

  // Renderizar totales
  const t = data.totales || {};
  const resumenTotales = `
    <div class="price-totals" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
      <div class="price-chip"><span class="label">Total perfiles</span>${precioFormatearEuro(t.total_perfiles || 0)}</div>
      <div class="price-chip"><span class="label">Total accesorios</span>${precioFormatearEuro(t.total_accesorios || 0)}</div>
      <div class="price-chip"><span class="label">Total presupuesto</span>${precioFormatearEuro(t.total_general || 0)}</div>
      <div class="price-chip"><span class="label">Metros comprados</span>${(t.metros_comprados_total || 0).toFixed(3)} m</div>
      <div class="price-chip"><span class="label">Metros útiles</span>${(t.metros_utiles_total || 0).toFixed(3)} m</div>
      <div class="price-chip"><span class="label">Desperdicio</span>${(t.desperdicio_total_m || 0).toFixed(3)} m</div>
      <div class="price-chip"><span class="label">Optimización</span>${(t.nivel_optimizacion_pct || 0).toFixed(1)}%</div>
    </div>
  `;

  if (totalesWeb) totalesWeb.innerHTML = "";
  if (totalesPdf) totalesPdf.innerHTML = resumenTotales;
}

/**
 * Limpia los informes económicos
 */
export function limpiarInformesEconomicos() {
  informesEconomicosUltimo = null;
  renderInformesEconomicos(null);
}

// ============================================================================
// FUNCIONES DE EXPORTACIÓN PARA DOCUMENTOS
// ============================================================================

/**
 * Obtiene el resumen de líneas para exportación
 * @returns {Array} Array de líneas del resumen económico
 */
export function obtenerResumenLineas() {
  return informesEconomicosUltimo?.resumen_lineas || [];
}

/**
 * Obtiene los totales del informe
 * @returns {object} Objeto con todos los totales
 */
export function obtenerTotales() {
  return informesEconomicosUltimo?.totales || {
    total_perfiles: 0,
    total_accesorios: 0,
    total_general: 0,
    metros_comprados_total: 0,
    metros_utiles_total: 0,
    desperdicio_total_m: 0,
    nivel_optimizacion_pct: 0
  };
}

/**
 * Obtiene el detalle de perfiles optimizados
 * @returns {Array} Array de perfiles con sus detalles
 */
export function obtenerDetallePerfiles() {
  return informesEconomicosUltimo?.perfiles || [];
}

/**
 * Obtiene el detalle de accesorios
 * @returns {Array} Array de accesorios
 */
export function obtenerDetalleAccesorios() {
  return informesEconomicosUltimo?.accesorios || [];
}
