/**
 * CÁLCULOS DE PÉRGOLA
 * =================================================================
 * Este módulo contiene las funciones de cálculo relacionadas con:
 * - Número de lamas según salida
 * - Cálculo de pilares según tipo de montaje
 * - Determinación de necesidad de refuerzo
 * - Generación de lista de materiales
 */

// Importar constantes desde config
import {
  LAMAS_TABLE,
  CALIBRE_PILAR_IA,
  AVISO_REFUERZO_TEXTO_PARED,
  AVISO_REFUERZO_TEXTO_ENTRE,
  DESCRIPCIONES_MONT,
  DESCRIPCIONES_MONT_DETALLADAS,
  DESCRIPCIONES
} from './config.js';

// Re-exportar constantes para que estén disponibles desde este módulo
export {
  LAMAS_TABLE,
  CALIBRE_PILAR_IA,
  AVISO_REFUERZO_TEXTO_PARED,
  AVISO_REFUERZO_TEXTO_ENTRE,
  DESCRIPCIONES_MONT,
  DESCRIPCIONES_MONT_DETALLADAS,
  DESCRIPCIONES
};

// ============================================================================
// CALCULADORES DE LONGITUD POR REFERENCIA
// ============================================================================

/**
 * Funciones que calculan la longitud necesaria de cada perfil según el contexto
 * Contexto incluye: anchoMm, salidaMm, alturaMm, modulos, anchoModuloMm
 */
export const calculadores_longitud = {
  // Largueros laterales: salida total
  "6391": ctx => ctx.salidaMm,
  
  // Perfiles que van en el ancho del módulo
  "7616": ctx => ctx.salidaMm,
  "6212": ctx => Math.max((ctx.anchoModuloMm ?? ctx.anchoMm) - 90, 0),
  
  // Travesaño lateral doble (entre módulos): salida total
  "6436": ctx => ctx.salidaMm,
  
  // Lamas y lama motor: ancho por módulo, con descuento distinto si hay varios módulos
  "6816": ctx => {
    const ancho = ctx.anchoModuloMm ?? ctx.anchoMm;
    const descuento = ctx.modulos > 1 ? 132 : 147;
    return Math.max(ancho - descuento, 0);
  },
  "6867": ctx => {
    const ancho = ctx.anchoModuloMm ?? ctx.anchoMm;
    const descuento = ctx.modulos > 1 ? 132 : 147;
    return Math.max(ancho - descuento, 0);
  },
  "9125": ctx => {
    const ancho = ctx.anchoModuloMm ?? ctx.anchoMm;
    const descuento = ctx.modulos > 1 ? 132 : 147;
    return Math.max(ancho - descuento, 0);
  },
  "6218": ctx => Math.max((ctx.anchoModuloMm ?? ctx.anchoMm) - 90, 0),
  "6217": ctx => Math.max((ctx.anchoModuloMm ?? ctx.anchoMm) - 90, 0),
  
  // Perfiles en sentido salida
  "7985B": ctx => ctx.salidaMm,
  "5960":  ctx => ctx.salidaMm,
  "1015B": ctx => ctx.salidaMm,
  
  // Otros perfiles a ancho de módulo
  "7497": ctx => ctx.anchoModuloMm ?? ctx.anchoMm,
  "6863": ctx => ctx.anchoModuloMm ?? ctx.anchoMm,
  
  // Pilares a altura
  "6323": ctx => ctx.alturaMm || 0,
  
  // Canalones / soportes lamas, a ancho de módulo
  "6211": ctx => ctx.anchoModuloMm ?? ctx.anchoMm,
  "6214": ctx => ctx.anchoModuloMm ?? ctx.anchoMm,
  "6211B": ctx => ctx.anchoModuloMm ?? ctx.anchoMm
};

// ============================================================================
// FUNCIONES DE CÁLCULO DE LAMAS
// ============================================================================

/**
 * Busca la fila correspondiente en la tabla de lamas según la salida
 * @param {number} salida - Salida en metros
 * @returns {object|null} Fila de la tabla o null
 */
export function buscarFilaLamas(salida) {
  if (!salida) return null;
  for (const fila of LAMAS_TABLE) {
    if (salida >= fila.min && salida <= fila.max) return fila;
  }
  if (salida < LAMAS_TABLE[0].min) return LAMAS_TABLE[0];
  return LAMAS_TABLE[LAMAS_TABLE.length - 1];
}

/**
 * Calcula el número de lamas según la salida
 * @param {number} salida - Salida en metros
 * @returns {number|null} Número de lamas
 */
export function calcularNumeroLamas(salida) {
  const fila = buscarFilaLamas(salida);
  return fila ? fila.n : null;
}

// ============================================================================
// FUNCIONES DE CÁLCULO DE PILARES Y REFUERZO
// ============================================================================

/**
 * Determina si un tipo de montaje requiere refuerzo
 * @param {string} tipoMontaje - Tipo de montaje
 * @param {string} tipoEntre - Tipo entre paredes (opcional)
 * @returns {boolean} True si requiere refuerzo
 */
export function requiereRefuerzo(tipoMontaje, tipoEntre = "laterales") {
  return tipoMontaje === "pared-largo" || 
         (tipoMontaje === "entre-paredes" && tipoEntre === "laterales");
}

/**
 * Cuenta el número de pilares de refuerzo necesarios
 * @param {string} tipoMontaje - Tipo de montaje
 * @param {boolean} incluirPilaresRefuerzo - Si incluir pilares de refuerzo
 * @param {string} tipoEntre - Tipo entre paredes
 * @returns {number} Número de pilares de refuerzo
 */
export function contarPilaresRefuerzo(tipoMontaje, incluirPilaresRefuerzo, tipoEntre = "laterales") {
  if (!incluirPilaresRefuerzo || !requiereRefuerzo(tipoMontaje, tipoEntre)) return 0;
  if (tipoMontaje === "entre-paredes" && tipoEntre === "laterales") return 4;
  return 2;
}

/**
 * Calcula el número de pilares según módulos y tipo de montaje
 * @param {number} modulos - Número de módulos
 * @param {string} tipoMontaje - Tipo de montaje
 * @param {string} tipoEntre - Tipo entre paredes
 * @returns {number} Número de pilares
 */
export function calcularPilares(modulos, tipoMontaje, tipoEntre = "laterales") {
  if (!modulos || modulos < 1) return 0;

  if (tipoMontaje === "pilares") {
    return 2 * modulos + 2;
  } else if (tipoMontaje === "pared-ancho") {
    return modulos + 1;
  } else if (tipoMontaje === "pared-largo") {
    return 2 * modulos;
  } else if (tipoMontaje === "entre-paredes") {
    if (tipoEntre === "laterales" && modulos > 1) return 2 * (modulos - 1);
    return 0;
  }
  return 0;
}

// ============================================================================
// FUNCIONES DE MOTORES
// ============================================================================

/**
 * Obtiene los lados de los motores para cada módulo
 * @param {number} modulos - Número de módulos
 * @param {string} modoMotor - Modo de motor (todos-izquierda, todos-derecha, personalizado)
 * @returns {Array<string>} Array con el lado de cada motor
 */
export function obtenerLadosMotores(modulos, modoMotor) {
  const lados = new Array(modulos).fill("izquierda");
  
  if (modoMotor === "todos-derecha") {
    return lados.map(() => "derecha");
  }
  
  if (modoMotor === "personalizado") {
    for (let i = 0; i < modulos; i++) {
      const sel = document.getElementById(`motor_mod_${i + 1}`);
      lados[i] = sel?.value === "derecha" ? "derecha" : "izquierda";
    }
  }
  
  return lados;
}

// ============================================================================
// FUNCIONES DE GENERACIÓN DE MATERIALES
// ============================================================================

/**
 * Genera la lista completa de materiales necesarios
 * @param {object} params - Parámetros de la pérgola
 * @returns {object} {materiales: {}, notas: {}}
 */
export function generarListaMateriales(params) {
  const {
    ancho,
    salida,
    altura,
    modulos,
    tipoMontaje,
    tipoEntre = "laterales",  // Valor por defecto
    numLamas,
    pilaresTotales,
    ladosMotores,
    mando,
    incluirPilaresRefuerzo,
    sensorLluvia,
    sensorViento,
    suplementoFrontal7497 = false   // Perfil opcional 7497
  } = params;

  const materiales = {};
  const notas = {};

  const add = (ref, cantidad) => {
    if (!ref || !cantidad || cantidad <= 0) return;
    materiales[ref] = (materiales[ref] || 0) + cantidad;
  };

  const anotar = (ref, texto) => {
    if (ref && texto) notas[ref] = texto;
  };

  if (!ancho || !salida || !numLamas || modulos < 1) {
    return { materiales, notas };
  }

  // Perfiles / barras por módulo
  add("6391", 2);              // laterales (SIEMPRE 2)
  add("7616", 2 * modulos);    // canalones laterales
  add("6212", 2 * modulos);    // frontales
  if (suplementoFrontal7497) add("7497", 2 * modulos); // suplemento frontal opcional
  add("1015B", 2 * modulos);   // lama tracción
  add("7985B", 2 * modulos);   // soporte lamas
  add("5960",  2 * modulos);   // tapeta clipada sobre 7985B (misma longitud)
  add("6867", 1 * modulos);    // lama motor
  
  const totalLamas = numLamas * modulos;
  add("6816", totalLamas);     // lamas normales
  add("6217", 1 * modulos);    // soporte lama compensación
  add("6218", 1 * modulos);    // lama compensadora

  if (modulos > 1) add("6436", modulos - 1); // larguero divisor

  // Tapas y kits por módulo / lama
  add("PB0005", 4 * modulos); // tapa canalón
  add("PB0032", totalLamas); // tapa lama dcha (1 por lama normal)
  add("PB0033", totalLamas); // tapa lama izda (1 por lama normal)
  add("PB0030", totalLamas); // kit tornillería lama (1 por lama normal)

  // Motor y kits
  add("MO4004", modulos);
  add("PB4505", modulos);       // adaptador motor: 1 por motor
  add("PB0031", modulos);
  add("TA2010", 4 * modulos);

  // Pilares y tapas
  add("6323", pilaresTotales);
  add("PB0044", pilaresTotales);
  add("PB0015", pilaresTotales);

  if (modulos > 1) add("PB0052", 2 * (modulos - 1)); // tapa larguero doble

  // Embellecedores PB0012 y PB0013 (van en extremos del perfil 6391)
  // Siempre hay 2 perfiles 6391, cada uno con 2 extremos = 4 extremos totales
  // NO llevan embellecedores cuando hay pared en los frontales:
  // - pared-ancho (frontal o trasera)
  // - entre-paredes con tipo frontales
  const esEntreParadesFrontales = tipoMontaje === "entre-paredes" && tipoEntre === "frontales";
  const tieneParedEnFrontales = tipoMontaje === "pared-ancho" || esEntreParadesFrontales;
  
  if (tieneParedEnFrontales) {
    // Con pared en frontales: solo llevan tapas si el lateral está libre
    if (tipoMontaje === "pared-ancho") {
      // Pared-ancho: solo el lado libre lleva tapas: 1 izquierda + 1 derecha
      add("PB0012", 1);
      add("PB0013", 1);
    }
    // Si es entre-paredes frontales: NO lleva ninguna tapa (0 embellecedores)
  } else {
    // Sin pared en frontales: ambos lados libres llevan tapas
    add("PB0012", 2);
    add("PB0013", 2);
  }

  // Tapas larguero doble PB0053 (van en extremos del perfil 6436)
  if (modulos > 1) {
    const cantidad6436 = modulos - 1;
    
    if (tieneParedEnFrontales) {
      if (tipoMontaje === "pared-ancho") {
        // Solo el extremo libre lleva tapa: 1 por cada perfil 6436
        add("PB0053", cantidad6436);
      }
      // Si es entre-paredes frontales: NO lleva tapas (0)
    } else {
      // Ambos extremos libres: 2 por cada perfil 6436
      add("PB0053", 2 * cantidad6436);
    }
  }

  // Soportes para montaje en pared
  if (tipoMontaje === "pared-ancho") {
    add("PB0050", 2);
    if (modulos > 1) add("PB0051", modulos - 1);
  }

  // Tapas motor según lado
  ladosMotores.forEach(side => {
    if (side === "izquierda") {
      add("PB0041", 1);
      add("PB0035", 1);
      add("PB0036", 1);
      add("PB0038", 1);
      add("PB0043", 2);
      add("PB0042", 1);
    } else {
      add("PB0040", 1);
      add("PB0034", 1);
      add("PB0037", 1);
      add("PB0039", 1);
      add("PB0042", 2);
      add("PB0043", 1);
    }
  });

  // Mando
  if (mando === "con") add("TM A5301", 1);

  // Goma GO 5248: metros según metros totales de lamas
  // Calculamos metros totales de lamas (6816 + 6867)
  const anchoMetros = ancho || 0;
  const anchoModuloMetros = anchoMetros / modulos;
  
  // Longitud aproximada por lama (ancho módulo - descuento promedio)
  const descuentoPromedio = modulos > 1 ? 0.132 : 0.147; // en metros
  const longitudPorLama = Math.max(anchoModuloMetros - descuentoPromedio, 0);
  
  // Total metros de lamas = (lamas normales + lamas motor) * longitud
  const totalMetrosLamas = (totalLamas + modulos) * longitudPorLama;
  
  // Redondear hacia arriba para asegurar material suficiente
  const metrosGoma = Math.ceil(totalMetrosLamas);
  add("GO 5248", metrosGoma);

  // Sensores opcionales (1 por pérgola)
  if (sensorLluvia) add("TM 5200", 1);
  if (sensorViento) add("TM 5201", 1);

  return { materiales, notas };
}