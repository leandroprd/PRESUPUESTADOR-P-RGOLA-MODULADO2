/**
 * UTILIDADES Y FUNCIONES HELPER
 * =================================================================
 * Este módulo contiene funciones de utilidad general:
 * - Conversión y formateo de datos
 * - Validaciones de campos
 * - Sanitización de nombres
 * - Generación de códigos
 * - Helpers de interfaz
 */

// ============================================================================
// CONVERSIÓN Y FORMATEO
// ============================================================================

/**
 * Convierte un valor a número de forma segura
 * @param {*} v - Valor a convertir
 * @returns {number|null} Número o null si no es válido
 */
export function safeNumber(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

/**
 * Formatea un número como precio en euros
 * @param {number} v - Valor a formatear
 * @returns {string} Precio formateado (ej: "1.234,56 €")
 */
export function precioFormatearEuro(v) {
  if (v === null || typeof v === "undefined") return "—";
  // Espacio no separable entre el número y el símbolo €
  return `${v.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}\u00A0€`;
}

/**
 * Sanitiza un string para usarlo como nombre de archivo
 * @param {string} str - String a sanitizar
 * @returns {string} String limpio para nombre de archivo
 */
export function sanitizeForFilename(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

/**
 * Genera un código de referencia basado en fecha y hora actual
 * Formato: YYYYMMDD-HHMMSS
 * @returns {string} Código de referencia
 */
export function generarCodigoRef() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) + "-" +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
}

/**
 * Genera una fecha formateada DD/MM/YYYY
 * @returns {string} Fecha formateada
 */
export function generarFechaFormateada() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
}

// ============================================================================
// VALIDACIONES
// ============================================================================

/**
 * Valida el campo de salida
 * @param {HTMLElement} inputElement - Elemento input de salida
 * @param {Function} mostrarErrorFn - Función para mostrar errores
 * @returns {number|null} Valor válido o null
 */
export function validarSalida(inputElement, mostrarErrorFn) {
  const salida = safeNumber(inputElement.value);
  if (!salida || salida < 1.5 || salida > 6.0) {
    mostrarErrorFn("salida", "La salida debe estar entre 1,50 y 6,00 m.");
    return null;
  } else {
    mostrarErrorFn("salida", "");
  }
  return salida;
}

/**
 * Valida el campo de ancho
 * @param {HTMLElement} inputElement - Elemento input de ancho
 * @param {number} modulos - Número de módulos
 * @param {Function} mostrarErrorFn - Función para mostrar errores
 * @returns {number|null} Valor válido o null
 */
export function validarAncho(inputElement, modulos, mostrarErrorFn) {
  const ancho = safeNumber(inputElement.value);

  if (!ancho || ancho < 1.5) {
    mostrarErrorFn("ancho", "El ancho mínimo es 1,50 m.");
    return null;
  }

  const anchoPorModulo = ancho / modulos;
  if (anchoPorModulo < 1.5 || anchoPorModulo > 4.0) {
    mostrarErrorFn("ancho", "Con el ancho y nº de módulos actuales no se cumple 1,50–4,00 m por módulo.");
    return null;
  } else {
    mostrarErrorFn("ancho", "");
  }

  return ancho;
}

/**
 * Valida el campo de altura
 * @param {HTMLElement} inputElement - Elemento input de altura
 * @param {number} pilaresCalculados - Número de pilares
 * @param {boolean} alturaObligatoria - Si la altura es obligatoria
 * @param {Function} mostrarErrorFn - Función para mostrar errores
 * @returns {object} {valor: number|null, valido: boolean}
 */
export function validarAltura(inputElement, pilaresCalculados, alturaObligatoria, mostrarErrorFn) {
  if (!inputElement) return { valor: null, valido: true };

  const altura = safeNumber(inputElement.value);
  const requiereAltura = alturaObligatoria || pilaresCalculados > 0;

  if (requiereAltura && altura === null) {
    mostrarErrorFn("altura", "Indica la altura libre (máx. 2,80 m) cuando hay pilares.");
    return { valor: null, valido: false };
  }

  if (altura !== null) {
    if (altura < 2.0) {
      mostrarErrorFn("altura", "La altura libre mínima es 2,00 m.");
      return { valor: null, valido: false };
    }
    if (altura > 2.8) {
      mostrarErrorFn("altura", "La altura libre no puede superar 2,80 m.");
      return { valor: null, valido: false };
    }
  }

  mostrarErrorFn("altura", "");
  return { valor: altura, valido: true };
}

// ============================================================================
// HELPERS DE INTERFAZ
// ============================================================================

/**
 * Muestra u oculta un mensaje de error en un campo
 * @param {string} idInput - ID del input
 * @param {string} mensaje - Mensaje de error (vacío para ocultar)
 */
export function mostrarError(idInput, mensaje) {
  const input = document.getElementById(idInput);
  const error = document.getElementById(idInput + "Error");
  if (!input || !error) return;
  error.textContent = mensaje || "";
  error.style.display = mensaje ? "block" : "none";
}

/**
 * Desactiva el autocompletado en todos los inputs del documento
 */
export function desactivarAutocompletado() {
  document.querySelectorAll("input, select, textarea").forEach(el => {
    el.setAttribute("autocomplete", "off");
  });
}

/**
 * Obtiene el número de módulos actual
 * @param {HTMLElement} chkElement - Checkbox de varios módulos
 * @param {HTMLElement} inputElement - Input de número de módulos
 * @returns {number} Número de módulos
 */
export function obtenerModulos(chkElement, inputElement) {
  const chk = chkElement.checked;
  if (!chk) return 1;
  let m = parseInt(inputElement.value, 10);
  if (!m || m < 2) {
    m = 2;
    inputElement.value = m;
  }
  return m;
}

/**
 * Muestra solo el documento especificado y oculta los demás
 * @param {string} idDoc - ID del documento a mostrar
 */
export function mostrarSoloDocumento(idDoc) {
  document.querySelectorAll(".documento-pdf").forEach(el => {
    el.style.display = "none";
  });
  if (idDoc) {
    const target = document.getElementById(idDoc);
    if (target) target.style.display = "block";
  }
}

// ============================================================================
// HELPERS DE CONFIGURACIÓN
// ============================================================================

/**
 * Lee la configuración de colores desde el DOM
 * @returns {object} Configuración de colores {modo, colorGlobal, colorLamas, colorPerimetro, descuento}
 */
export function leerConfigColores() {
  const modo = document.querySelector("input[name='colorModo']:checked")?.value || "mono";
  const colorGlobal = document.getElementById("colorGlobal")?.value || "blanco";
  const colorLamas = document.getElementById("colorLamas")?.value || colorGlobal;
  const colorPerimetro = document.getElementById("colorPerimetro")?.value || colorGlobal;
  const descuentoInput = safeNumber(document.getElementById("descuentoAluminio")?.value);
  const descuento = Math.min(60, Math.max(0, descuentoInput || 0));
  return {
    modo,
    colorGlobal,
    colorLamas: modo === "bicolor" ? colorLamas : colorGlobal,
    colorPerimetro: modo === "bicolor" ? colorPerimetro : colorGlobal,
    descuento
  };
}

/**
 * Lee las referencias de acabado desde el DOM
 * @returns {object} Referencias {global, lamas, perimetro}
 */
export function leerReferenciasAcabado() {
  const modo = document.querySelector("input[name='colorModo']:checked")?.value || "mono";
  const refGlobal = (document.getElementById("refAcabadoGlobal")?.value || "").trim();
  const refLamas = (document.getElementById("refAcabadoLamas")?.value || "").trim();
  const refPerimetro = (document.getElementById("refAcabadoPerimetro")?.value || "").trim();
  return {
    global: refGlobal || "SIN ESPECIFICAR",
    lamas: modo === "bicolor" ? refLamas || "SIN ESPECIFICAR" : refGlobal || "SIN ESPECIFICAR",
    perimetro: modo === "bicolor" ? refPerimetro || "SIN ESPECIFICAR" : refGlobal || "SIN ESPECIFICAR"
  };
}

/**
 * Elige el acabado correcto según el grupo de color
 * @param {string} grupo - Grupo de color (lamas, perimetro, estructura, neutro)
 * @param {object} config - Configuración de colores
 * @returns {string} Acabado elegido
 */
export function elegirAcabado(grupo, config) {
  if (grupo === "lamas") return config.colorLamas;
  if (grupo === "perimetro" || grupo === "estructura") return config.colorPerimetro;
  return "sa";
}

/**
 * Convierte el acabado a texto capitalizado
 * @param {string} grupo - Grupo de color
 * @param {object} config - Configuración de colores
 * @returns {string} Acabado en texto
 */
export function acabadoATexto(grupo, config) {
  const acabado = elegirAcabado(grupo, config);
  return acabado ? acabado.charAt(0).toUpperCase() + acabado.slice(1) : "";
}

/**
 * Elige la referencia de acabado según el grupo
 * @param {string} grupo - Grupo de color
 * @param {object} refs - Referencias de acabado
 * @returns {string} Referencia elegida
 */
export function elegirReferenciaAcabado(grupo, refs) {
  if (grupo === "lamas") return refs.lamas;
  if (grupo === "perimetro" || grupo === "estructura") return refs.perimetro;
  return refs.global || "SIN ESPECIFICAR";
}
