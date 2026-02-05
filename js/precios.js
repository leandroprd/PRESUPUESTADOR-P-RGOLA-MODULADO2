/**
 * GESTIÓN DE PRECIOS Y OPTIMIZACIÓN DE BARRAS
 * =================================================================
 * Este módulo contiene las funciones relacionadas con:
 * - Optimización de corte de barras (algoritmo greedy)
 * - Cálculo de precios por perfil y accesorio
 * - Generación de piezas por perfil
 * - Aplicación de descuentos
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
  DESCRIPCIONES,
  calculadores_longitud 
} from './calculosPergola.js';

import { 
  elegirAcabado,
  precioFormatearEuro 
} from './utils.js';

// ============================================================================
// GENERACIÓN DE PIEZAS POR PERFIL
// ============================================================================

/**
 * Genera las piezas individuales de cada perfil con sus longitudes calculadas
 * @param {object} materiales - Objeto con cantidades de materiales
 * @param {object} ctx - Contexto con dimensiones (ancho, salida, altura, modulos, numLamas)
 * @returns {object} Objeto con ref -> array de longitudes en mm
 */
export function generarPiezasPerfiles(materiales, ctx) {
  const piezas = {};

  const modulos =
    typeof ctx.modulos === "number" && ctx.modulos > 0 ? ctx.modulos : 1;
  const numLamas =
    typeof ctx.numLamas === "number" && ctx.numLamas > 0 ? ctx.numLamas : null;

  const anchoTotalMm = Math.round((ctx.ancho || 0) * 1000);
  const salidaMm = Math.round((ctx.salida || 0) * 1000);
  const alturaMm = Math.round((ctx.altura || 0) * 1000);

  // De momento consideramos módulos iguales de ancho
  const anchoModuloEsquinaMm = modulos > 0 ? Math.round(anchoTotalMm / modulos) : 0;
  const anchoModuloCentralMm = anchoModuloEsquinaMm;

  // Contexto "genérico" para el resto de perfiles
  const baseCtx = {
    anchoMm: anchoTotalMm,
    salidaMm,
    alturaMm,
    modulos,
    anchoModuloMm: anchoModuloEsquinaMm
  };

  Object.entries(materiales || {}).forEach(([ref, cantidad]) => {
    if ((TIPO_MATERIAL[ref] || "accesorio") !== "perfil") return;

    // ============================
    // 1) LAMAS Y LAMA MOTOR
    // ============================
    if ((ref === "6816" || ref === "6867" || ref === "9125") && modulos > 1 && numLamas) {
      const piezasRef = [];

      const nModEsquina = Math.min(modulos, 2);
      const nModCentral = Math.max(0, modulos - nModEsquina);

      const nLamasEsquina = nModEsquina * numLamas;
      const nLamasCentral = nModCentral * numLamas;

      const largoEsquina = Math.max(anchoModuloEsquinaMm - 132, 0);
      const largoCentral = Math.max(anchoModuloCentralMm - 117, 0);

      for (let i = 0; i < nLamasEsquina; i++) piezasRef.push(largoEsquina);
      for (let i = 0; i < nLamasCentral; i++) piezasRef.push(largoCentral);

      // Por seguridad, ajustamos al "cantidad" real
      while (piezasRef.length < cantidad) piezasRef.push(largoEsquina);
      if (piezasRef.length > cantidad) piezasRef.length = cantidad;

      piezas[ref] = piezasRef;
      return;
    }

    // ============================
    // 2) PERFIL FRONTAL 6212
    // ============================
    if (ref === "6212" && modulos > 1) {
      const piezasRef = [];

      const nModEsquina = Math.min(modulos, 2);
      const nModCentral = Math.max(0, modulos - nModEsquina);

      const largoEsquina = Math.max(anchoModuloEsquinaMm - 75, 0);
      const largoCentral = Math.max(anchoModuloCentralMm - 60, 0);

      // En principio 1 frontal por módulo
      for (let i = 0; i < nModEsquina; i++) piezasRef.push(largoEsquina);
      for (let i = 0; i < nModCentral; i++) piezasRef.push(largoCentral);

      while (piezasRef.length < cantidad) piezasRef.push(largoEsquina);
      if (piezasRef.length > cantidad) piezasRef.length = cantidad;

      piezas[ref] = piezasRef;
      return;
    }

    // ============================
    // 3) TUBO FRONTAL 7497
    // ============================
    if (ref === "7497" && modulos > 1) {
      const piezasRef = [];

      const nModEsquina = Math.min(modulos, 2);
      const nModCentral = Math.max(0, modulos - nModEsquina);

      const largoEsquina = Math.max(anchoModuloEsquinaMm - 237, 0);
      const largoCentral = Math.max(anchoModuloCentralMm - 222, 0);

      for (let i = 0; i < nModEsquina; i++) piezasRef.push(largoEsquina);
      for (let i = 0; i < nModCentral; i++) piezasRef.push(largoCentral);

      while (piezasRef.length < cantidad) piezasRef.push(largoEsquina);
      if (piezasRef.length > cantidad) piezasRef.length = cantidad;

      piezas[ref] = piezasRef;
      return;
    }

    // ============================
    // 4) RESTO DE PERFILES (GENÉRICO)
    // ============================
    const calc = calculadores_longitud[ref];
    const largo = calc ? calc(baseCtx) : anchoTotalMm;
    if (!largo || largo <= 0) return;
    piezas[ref] = Array.from({ length: cantidad }, () => largo);
  });

  return piezas;
}

// ============================================================================
// ALGORITMO DE OPTIMIZACIÓN DE BARRAS (GREEDY)
// ============================================================================

/**
 * Construye una solución greedy para el problema de corte de barras
 * @param {Array<number>} piezasMm - Array de longitudes de piezas en mm
 * @param {Array<number>} longitudesBarraMm - Array de longitudes de barras disponibles en mm
 * @param {Function} piezasComparator - Función de comparación para ordenar piezas
 * @param {Function} longComparator - Función de comparación para ordenar longitudes
 * @returns {Array} Array de barras con sus piezas asignadas
 */
function construirSolucionGreedy(
  piezasMm, 
  longitudesBarraMm, 
  piezasComparator = (a, b) => b - a, 
  longComparator = (a, b) => a - b
) {
  const piezas = [...piezasMm].sort(piezasComparator);
  const longitudes = [...longitudesBarraMm].sort(longComparator);
  const barras = [];

  const crearBarra = longitudTotalMm => {
    const capacidadInicial = longitudTotalMm - 2 * MARGEN_PUNTA_MM - MERMA_CORTE_MM;
    return {
      longitud: longitudTotalMm,
      capacidadRestante: capacidadInicial,
      piezas: []
    };
  };

  const seleccionarBarraNueva = pieza => {
    const longitudMinimaNecesaria = pieza + (1 + 1) * MERMA_CORTE_MM + 2 * MARGEN_PUNTA_MM;
    const candidata = longitudes.find(l => l >= longitudMinimaNecesaria);
    return candidata !== undefined ? candidata : longitudes[longitudes.length - 1];
  };

  piezas.forEach(pieza => {
    const consumo = pieza + MERMA_CORTE_MM;
    let mejorIndice = -1;
    let mejorResto = Infinity;

    barras.forEach((barra, idx) => {
      if (consumo <= barra.capacidadRestante) {
        const resto = barra.capacidadRestante - consumo;
        if (resto < mejorResto) {
          mejorResto = resto;
          mejorIndice = idx;
        }
      }
    });

    if (mejorIndice >= 0) {
      barras[mejorIndice].capacidadRestante -= consumo;
      barras[mejorIndice].piezas.push(pieza);
    } else {
      const seleccion = seleccionarBarraNueva(pieza);
      const nuevaBarra = crearBarra(seleccion);
      nuevaBarra.capacidadRestante = Math.max(0, nuevaBarra.capacidadRestante - consumo);
      nuevaBarra.piezas.push(pieza);
      barras.push(nuevaBarra);
    }
  });

  return barras;
}

/**
 * Evalúa una solución de corte calculando el desperdicio total
 * @param {Array} barras - Array de barras con piezas asignadas
 * @returns {object} {barras, desperdicioTotal}
 */
function evaluarSolucionBarras(barras) {
  const desperdicioTotal = barras.reduce((acc, b) => {
    const sumaPiezas = b.piezas.reduce((s, p) => s + p, 0);
    return acc + (b.longitud - sumaPiezas);
  }, 0);
  return { barras, desperdicioTotal };
}

/**
 * Compara dos soluciones para determinar cuál es mejor
 * @param {object} candidata - Solución candidata
 * @param {object} actual - Solución actual
 * @returns {boolean} True si la candidata es mejor
 */
function esMejorSolucion(candidata, actual) {
  if (!candidata) return false;
  if (!actual) return true;

  // 1) Primero: menor desperdicio total
  if (candidata.desperdicioTotal < actual.desperdicioTotal) return true;
  if (candidata.desperdicioTotal > actual.desperdicioTotal) return false;

  // 2) Si empatan en desperdicio, menos barras
  if (candidata.barras.length < actual.barras.length) return true;
  if (candidata.barras.length > actual.barras.length) return false;

  return false;
}

/**
 * Refina la solución probando diferentes ordenamientos
 * @param {Array<number>} piezasMm - Piezas en mm
 * @param {Array<number>} longitudesBarraMm - Longitudes disponibles en mm
 * @param {object} solucionInicial - Solución inicial
 * @returns {object} Mejor solución encontrada
 */
function refinarSolucionOptima(piezasMm, longitudesBarraMm, solucionInicial) {
  let mejor = solucionInicial;
  const ordenesPiezas = [
    (a, b) => b - a,
    (a, b) => a - b
  ];
  const ordenesLongitudes = [
    (a, b) => a - b,
    (a, b) => b - a
  ];

  ordenesPiezas.forEach(op => {
    ordenesLongitudes.forEach(ol => {
      const barras = construirSolucionGreedy(piezasMm, longitudesBarraMm, op, ol);
      const evaluada = evaluarSolucionBarras(barras);
      if (esMejorSolucion(evaluada, mejor)) {
        mejor = evaluada;
      }
    });
  });

  return mejor;
}

/**
 * Optimiza el corte de barras para un perfil específico
 * @param {string} ref - Referencia del perfil
 * @param {Array<number>} piezasMm - Array de longitudes de piezas en mm
 * @returns {object} {barrasPorLongitud, desperdicioTotal}
 */
export function optimizarBarras(ref, piezasMm) {
  const perfil = precio_perfiles[ref];
  if (!perfil || !piezasMm || !piezasMm.length) {
    return { barrasPorLongitud: {}, desperdicioTotal: 0 };
  }

  const longitudes = (perfil.longitudes_barra || [])
    .map(l => Math.round(l * 1000))
    .sort((a, b) => a - b);

  const baseBarras = construirSolucionGreedy(piezasMm, longitudes);
  let solucion = evaluarSolucionBarras(baseBarras);

  // SIEMPRE intentamos refinar y, si mejora, la usamos
  const refinada = refinarSolucionOptima(piezasMm, longitudes, solucion);
  if (esMejorSolucion(refinada, solucion)) {
    solucion = refinada;
  }

  const barrasPorLongitud = {};
  solucion.barras.forEach(b => {
    barrasPorLongitud[b.longitud] = (barrasPorLongitud[b.longitud] || 0) + 1;
  });

  return { barrasPorLongitud, desperdicioTotal: solucion.desperdicioTotal };
}

// ============================================================================
// CÁLCULO DE PRECIOS
// ============================================================================

/**
 * Calcula el precio total de los perfiles con optimización de barras
 * @param {object} piezasPerfiles - Piezas por perfil
 * @param {object} config - Configuración de colores y descuentos
 * @returns {object} Resultados con subtotales, descuentos y detalle
 */
export function calcularPerfiles(piezasPerfiles, config) {
  const detalle = [];
  let subtotalSinDto = 0;
  let subtotalConDto = 0;
  let pesoTotal = 0;
  let perimetroTotal = 0;

  Object.entries(piezasPerfiles || {}).forEach(([ref, piezas]) => {
    const perfil = precio_perfiles[ref] || { 
      nombre: DESCRIPCIONES[ref] || ref, 
      grupo_color: "perimetro", 
      precio_m: {} 
    };
    const acabado = elegirAcabado(perfil.grupo_color, config);
    const precioM = perfil.precio_m?.[acabado];
    const tienePrecio = typeof precioM === "number" && !isNaN(precioM);

    const opt = optimizarBarras(ref, piezas);
    let costeRef = 0;
    if (tienePrecio) {
      Object.entries(opt.barrasPorLongitud).forEach(([longitudMm, unidades]) => {
        const metros = (Number(longitudMm) / 1000) * unidades;
        costeRef += metros * precioM;
      });
    }

    const longitudTotalM = piezas.reduce((acc, l) => acc + l, 0) / 1000;
    subtotalSinDto += costeRef;
    const costeConDto = tienePrecio ? costeRef * (1 - config.descuento / 100) : 0;
    subtotalConDto += costeConDto;

    pesoTotal += longitudTotalM * (perfil.peso_kg_m || 0);
    perimetroTotal += longitudTotalM * (perfil.perimetro_total_mm || 0);

    detalle.push({
      ref,
      descripcion: perfil.nombre,
      acabado,
      barras: opt.barrasPorLongitud,
      desperdicio: opt.desperdicioTotal,
      coste: costeConDto
    });
  });

  return { 
    subtotalSinDto, 
    subtotalConDto, 
    descuento: subtotalSinDto - subtotalConDto, 
    pesoTotal, 
    perimetroTotal, 
    detalle 
  };
}

/**
 * Calcula el precio total de los accesorios
 * @param {object} unidades - Unidades de cada accesorio
 * @param {object} config - Configuración de colores
 * @returns {object} {total, detalle}
 */
export function calcularAccesorios(unidades, config) {
  const detalle = [];
  let total = 0;

  Object.entries(unidades || {}).forEach(([ref, cantidad]) => {
    if (cantidad <= 0) return;
    const acc = precio_accesorios[ref] || { 
      nombre: DESCRIPCIONES[ref] || ref, 
      grupo_color: "neutro", 
      precios: { sa: 0 } 
    };
    const acabado = elegirAcabado(acc.grupo_color, config);
    const precioUnit = acc.precios?.[acabado] ?? acc.precios?.sa;
    if (precioUnit === undefined) return;
    const coste = precioUnit * cantidad;
    total += coste;
    detalle.push({ 
      ref, 
      descripcion: acc.nombre, 
      acabado, 
      barras: null, 
      desperdicio: 0, 
      coste 
    });
  });

  return { total, detalle };
}

/**
 * Función principal de cálculo de precios
 * @param {object} materiales - Materiales necesarios
 * @param {object} ctx - Contexto con dimensiones
 * @param {object} config - Configuración de colores y descuentos
 * @returns {object} Resultado completo del cálculo
 */
export function calcularPrecios(materiales, ctx, config) {
  if (!materiales || !Object.keys(materiales).length) {
    return null;
  }

  const piezasPerfiles = generarPiezasPerfiles(materiales, ctx);
  const perfiles = calcularPerfiles(piezasPerfiles, config);

  const accesorios = calcularAccesorios(
    Object.fromEntries(
      Object.entries(materiales).filter(([ref]) => 
        (TIPO_MATERIAL[ref] || "accesorio") !== "perfil"
      )
    ),
    config
  );

  const totalMaterial = perfiles.subtotalConDto + accesorios.total;
  const detalle = [...perfiles.detalle, ...accesorios.detalle];

  return {
    perfiles,
    accesorios,
    totalMaterial,
    pesoTotal: perfiles.pesoTotal,
    perimetroTotal: perfiles.perimetroTotal,
    detalle
  };
}
