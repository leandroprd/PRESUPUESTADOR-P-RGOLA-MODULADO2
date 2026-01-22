/**
 * INICIALIZACIÓN Y EVENT LISTENERS
 * =================================================================
 * Este módulo contiene:
 * - Configuración de event listeners
 * - Inicialización de la aplicación
 * - Funciones de actualización de UI
 * - Gestión de estados y reseteo
 */

// Importar funciones necesarias de otros módulos
import { VERSION } from './config.js';
import {
  desactivarAutocompletado,
  mostrarError,
  obtenerModulos,
  generarCodigoRef,
  mostrarSoloDocumento
} from './utils.js';

import {
  calcularNumeroLamas,
  calcularPilares,
  contarPilaresRefuerzo,
  requiereRefuerzo,
  obtenerLadosMotores,
  generarListaMateriales,
  DESCRIPCIONES_MONT,
  DESCRIPCIONES_MONT_DETALLADAS,
  AVISO_REFUERZO_TEXTO_PARED,
  AVISO_REFUERZO_TEXTO_ENTRE
} from './calculosPergola.js';

import {
  renderDiagram,
  actualizarResumenLamasUI,
  actualizarResumenConfig,
  actualizarCalibrePilares,
  renderTablaMateriales,
  renderPreciosUI
} from './renderizado.js';

import {
  generarPiezasPerfiles,
  calcularPrecios
} from './precios.js';

import {
  calcularInformesEconomicos,
  renderInformesEconomicos,
  limpiarInformesEconomicos
} from './informes.js';

import { leerConfigColores } from './utils.js';

// ============================================================================
// VARIABLES GLOBALES DE ESTADO
// ============================================================================

let salidaValida = false;
let anchoValido = false;
let precioUltimoCalculo = null;
let ultimoMaterialesContext = null;

// ============================================================================
// FUNCIONES DE ACTUALIZACIÓN DE CAMPOS
// ============================================================================

/**
 * Actualiza los campos de montaje según el tipo seleccionado
 */
export function actualizarCamposMontaje() {
  const tipo = document.querySelector("input[name='montaje']:checked")?.value || "pilares";
  const campoPared = document.getElementById("campoPosicionPared");
  const campoEntre = document.getElementById("campoEntreParedes");
  const selPared = document.getElementById("posicionPared");
  const chkRefuerzo = document.getElementById("chkPilaresRefuerzo");
  const textoDetallado = document.getElementById("textoMontajeDetallado");

  campoPared.style.display = "none";
  campoEntre.style.display = "none";
  selPared.innerHTML = "";
  if (chkRefuerzo) chkRefuerzo.checked = false;

  if (tipo === "pared-ancho") {
    campoPared.style.display = "block";
    selPared.innerHTML =
      '<option value="delantera">Delantera</option><option value="trasera">Trasera</option>';
  } else if (tipo === "pared-largo") {
    campoPared.style.display = "block";
    selPared.innerHTML =
      '<option value="izquierda">Izquierda</option><option value="derecha">Derecha</option>';
  } else if (tipo === "entre-paredes") {
    campoEntre.style.display = "block";
  }

  document.getElementById("textoMontaje").textContent = DESCRIPCIONES_MONT[tipo] || "";
  if (textoDetallado) textoDetallado.textContent = DESCRIPCIONES_MONT_DETALLADAS[tipo] || "";
  
  const tipoEntre = document.getElementById("tipoEntreParedes")?.value || "laterales";
  actualizarAvisoRefuerzo(tipo, chkRefuerzo?.checked, tipoEntre);
}

/**
 * Actualiza las opciones de motor según el número de módulos
 */
export function actualizarOpcionesMotorSegunModulos() {
  const chkVarios = document.getElementById("chkVariosModulos");
  const inputModulos = document.getElementById("modulos");
  const modulos = obtenerModulos(chkVarios, inputModulos);
  const tieneVarios = modulos > 1;
  const pillPers = document.getElementById("pillPersonalizado");
  const labelIzq = document.getElementById("labelMotorIzquierda");
  const labelDer = document.getElementById("labelMotorDerecha");

  if (tieneVarios) {
    pillPers.style.display = "inline-flex";
    labelIzq.textContent = "Todos a izquierda";
    labelDer.textContent = "Todos a derecha";
  } else {
    pillPers.style.display = "none";
    labelIzq.textContent = "Motor a izquierda";
    labelDer.textContent = "Motor a derecha";
    const inputPers = document.querySelector("input[name='modoMotor'][value='personalizado']");
    const inputIzq = document.querySelector("input[name='modoMotor'][value='todos-izquierda']");
    if (inputPers && inputPers.checked && inputIzq) inputIzq.checked = true;
  }
}

/**
 * Actualiza la UI de motor por módulo
 */
export function actualizarMotorPorModuloUI() {
  const modoMotor = document.querySelector("input[name='modoMotor']:checked")?.value || "todos-izquierda";
  const wrapper = document.getElementById("motorPorModuloWrapper");
  const container = document.getElementById("motorPorModuloContainer");
  const chkVarios = document.getElementById("chkVariosModulos");
  const inputModulos = document.getElementById("modulos");
  const modulos = obtenerModulos(chkVarios, inputModulos);

  if (modoMotor !== "personalizado" || modulos <= 1) {
    wrapper.style.display = "none";
    container.innerHTML = "";
    return;
  }

  wrapper.style.display = "block";
  container.innerHTML = "";

  let base = "izquierda";
  const radioDer = document.querySelector("input[name='modoMotor'][value='todos-derecha']");
  if (radioDer && radioDer.checked) base = "derecha";

  for (let i = 1; i <= modulos; i++) {
    const div = document.createElement("div");
    div.className = "field";
    div.innerHTML = `
      <label>Módulo ${i}</label>
      <select id="motor_mod_${i}">
        <option value="izquierda">Izquierda</option>
        <option value="derecha">Derecha</option>
      </select>
    `;
    container.appendChild(div);
    const sel = div.querySelector("select");
    sel.value = base;
    sel.addEventListener("change", actualizarConfiguracionRapida);
  }
}

/**
 * Actualiza el aviso de refuerzo
 */
export function actualizarAvisoRefuerzo(tipoMontaje, incluirPilaresRefuerzo, tipoEntre = "laterales") {
  const bloque = document.getElementById("bloqueRefuerzo");
  const aviso = document.getElementById("avisoRefuerzo");
  const chk = document.getElementById("chkPilaresRefuerzo");
  const resumenAvisos = document.getElementById("resumenAvisosMontaje");

  const esParedLargo = tipoMontaje === "pared-largo";
  const esEntreLaterales = tipoMontaje === "entre-paredes" && tipoEntre === "laterales";
  const textoAviso = esEntreLaterales ? AVISO_REFUERZO_TEXTO_ENTRE : AVISO_REFUERZO_TEXTO_PARED;
  const textoCheckbox = esEntreLaterales
    ? "Añadir pilares de refuerzo en los laterales apoyados en pared"
    : "Añadir pilares de refuerzo en el lateral apoyado en pared";
  const mostrarBloque = esParedLargo || esEntreLaterales;

  if (bloque) {
    bloque.style.display = mostrarBloque ? "block" : "none";
    const chkTexto = bloque.querySelector("label.inline-checkbox span");
    if (chkTexto) chkTexto.textContent = textoCheckbox;
    if (!mostrarBloque && chk) chk.checked = false;
  }

  const mostrarAviso = mostrarBloque && !incluirPilaresRefuerzo;
  if (aviso) {
    aviso.classList.add("aviso-amarillo");
    aviso.style.display = mostrarAviso ? "block" : "none";
    aviso.textContent = mostrarAviso ? textoAviso : "";
  }

  if (resumenAvisos) {
    resumenAvisos.classList.add("aviso-amarillo");
    resumenAvisos.textContent = mostrarAviso ? textoAviso : "";
    resumenAvisos.setAttribute("data-show-pdf", mostrarAviso ? "1" : "0");
  }
}

/**
 * Actualiza los campos de color de la pérgola
 */
export function actualizarCamposColorPergola() {
  const modo = document.querySelector("input[name='colorModo']:checked")?.value || "mono";
  const mostrarBicolor = modo === "bicolor";
  const campoGlobal = document.getElementById("campoColorGlobal");
  const campoLamas = document.getElementById("campoColorLamas");
  const campoPerimetro = document.getElementById("campoColorPerimetro");
  const refGlobal = document.getElementById("refAcabadoGlobalWrap");
  const refLamas = document.getElementById("refAcabadoLamasWrap");
  const refPerimetro = document.getElementById("refAcabadoPerimetroWrap");
  
  if (campoGlobal) campoGlobal.style.display = mostrarBicolor ? "none" : "block";
  if (campoLamas) campoLamas.style.display = mostrarBicolor ? "block" : "none";
  if (campoPerimetro) campoPerimetro.style.display = mostrarBicolor ? "block" : "none";
  if (refGlobal) refGlobal.style.display = mostrarBicolor ? "none" : "block";
  if (refLamas) refLamas.style.display = mostrarBicolor ? "block" : "none";
  if (refPerimetro) refPerimetro.style.display = mostrarBicolor ? "block" : "none";
}

/**
 * Actualiza los datos de cabecera del presupuesto
 */
export function actualizarDatosCabeceraPresupuesto() {
  const comercial = document.getElementById("comercial")?.value.trim() || "";
  const cliente = document.getElementById("cliente")?.value.trim() || "";
  const refObra = document.getElementById("refObra")?.value.trim() || "";
  const bi = document.getElementById("budgetInfo");
  if (!bi) return;

  document.getElementById("biComercial").textContent = comercial;
  document.getElementById("biCliente").textContent = cliente;
  document.getElementById("biRefObra").textContent = refObra;

  bi.style.display = (comercial || cliente || refObra) ? "grid" : "none";
}

/**
 * Actualiza la visibilidad de los informes
 */
export function actualizarVisibilidadInformes() {
  const selector = document.getElementById("selectorDocumento");
  const tipo = selector?.value || "presupuesto";
  mostrarSoloDocumento(`doc-${tipo}`);
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN
// ============================================================================

/**
 * Actualiza toda la configuración de la pérgola
 */
export function actualizarConfiguracionRapida() {
  const inputSalida = document.getElementById("salida");
  const inputAncho = document.getElementById("ancho");
  const inputAltura = document.getElementById("altura");
  
  const tipoMontaje = document.querySelector("input[name='montaje']:checked")?.value || "pilares";
  const tipoEntre = document.getElementById("tipoEntreParedes")?.value || "laterales";
  const incluirPilaresRefuerzo = requiereRefuerzo(tipoMontaje, tipoEntre) && 
                                 document.getElementById("chkPilaresRefuerzo")?.checked;

  actualizarAvisoRefuerzo(tipoMontaje, incluirPilaresRefuerzo, tipoEntre);

  // Validar salida y ancho
  const salida = safeNumber(inputSalida.value);
  if (!salida || salida < 1.5 || salida > 6.0) {
    mostrarError("salida", "La salida debe estar entre 1,50 y 6,00 m.");
    salidaValida = false;
    document.getElementById("pilaresDisplay").textContent = "—";
    actualizarCalibrePilares(null);
    renderDiagram(null, null, null, null, null, null, null, false);
    renderTablaMateriales({}, {});
    return;
  } else {
    mostrarError("salida", "");
    salidaValida = true;
  }

  const chkVarios = document.getElementById("chkVariosModulos");
  const inputModulos = document.getElementById("modulos");
  const modulos = obtenerModulos(chkVarios, inputModulos);
  
  const ancho = safeNumber(inputAncho.value);
  if (!ancho || ancho < 1.5) {
    mostrarError("ancho", "El ancho mínimo es 1,50 m.");
    anchoValido = false;
    return;
  }

  const anchoPorModulo = ancho / modulos;
  if (anchoPorModulo < 1.5 || anchoPorModulo > 4.0) {
    mostrarError("ancho", "Con el ancho y nº de módulos actuales no se cumple 1,50–4,00 m por módulo.");
    anchoValido = false;
    return;
  } else {
    mostrarError("ancho", "");
    anchoValido = true;
  }

  const modoMotor = document.querySelector("input[name='modoMotor']:checked")?.value || "todos-izquierda";
  const mando = document.getElementById("mando").value || "con";

  actualizarOpcionesMotorSegunModulos();

  const numLamasTabla = calcularNumeroLamas(salida);
  const pilares = calcularPilares(modulos, tipoMontaje, tipoEntre);
  const pilaresRefuerzo = contarPilaresRefuerzo(tipoMontaje, incluirPilaresRefuerzo, tipoEntre);
  const pilaresTotales = pilares + pilaresRefuerzo;
  
  document.getElementById("pilaresDisplay").textContent = pilaresTotales || 0;
  actualizarCalibrePilares(pilaresTotales);

  const ladosMotores = obtenerLadosMotores(modulos, modoMotor);
  const requiereAlturaExtra = requiereRefuerzo(tipoMontaje, tipoEntre) && incluirPilaresRefuerzo;

  const altura = safeNumber(inputAltura.value);
  const requiereAltura = requiereAlturaExtra || pilaresTotales > 0;

  if (requiereAltura && altura === null) {
    mostrarError("altura", "Indica la altura libre (máx. 2,80 m) cuando hay pilares.");
    actualizarResumenLamasUI(salida);
    renderDiagram(ancho, salida, modulos, tipoMontaje, pilares, ladosMotores, numLamasTabla, incluirPilaresRefuerzo);
    renderTablaMateriales({}, {});
    return;
  }

  if (altura !== null) {
    if (altura < 2.0) {
      mostrarError("altura", "La altura libre mínima es 2,00 m.");
      return;
    }
    if (altura > 2.8) {
      mostrarError("altura", "La altura libre no puede superar 2,80 m.");
      return;
    }
  }

  mostrarError("altura", "");

  actualizarResumenConfig(ancho, salida, altura, modulos, tipoMontaje, pilaresTotales, numLamasTabla, modoMotor, ladosMotores, mando);
  actualizarResumenLamasUI(salida);
  renderDiagram(ancho, salida, modulos, tipoMontaje, pilares, ladosMotores, numLamasTabla, incluirPilaresRefuerzo);

  calcularMateriales(true, incluirPilaresRefuerzo);
}

// ============================================================================
// CÁLCULO DE MATERIALES Y PRECIOS
// ============================================================================

/**
 * Calcula los materiales necesarios
 */
export function calcularMateriales(auto = false, incluirPilaresRefuerzoParam) {
  const inputSalida = document.getElementById("salida");
  const inputAncho = document.getElementById("ancho");
  const inputAltura = document.getElementById("altura");
  
  const salida = safeNumber(inputSalida.value);
  const ancho = safeNumber(inputAncho.value);
  
  if (!salida || !ancho || !salidaValida || !anchoValido) {
    precioLimpiarUI();
    return;
  }

  const tipoMontaje = document.querySelector("input[name='montaje']:checked")?.value || "pilares";
  const tipoEntre = document.getElementById("tipoEntreParedes")?.value || "laterales";
  const modoMotor = document.querySelector("input[name='modoMotor']:checked")?.value || "todos-izquierda";
  const mando = document.getElementById("mando").value || "con";
  
  const chkVarios = document.getElementById("chkVariosModulos");
  const inputModulos = document.getElementById("modulos");
  const modulos = obtenerModulos(chkVarios, inputModulos);
  
  const chkRefuerzo = document.getElementById("chkPilaresRefuerzo");
  const incluirPilaresRefuerzo =
    typeof incluirPilaresRefuerzoParam === "boolean"
      ? incluirPilaresRefuerzoParam
      : (requiereRefuerzo(tipoMontaje, tipoEntre) && chkRefuerzo && chkRefuerzo.checked);

  const numLamas = calcularNumeroLamas(salida);
  const pilares = calcularPilares(modulos, tipoMontaje, tipoEntre);
  const pilaresRefuerzo = contarPilaresRefuerzo(tipoMontaje, incluirPilaresRefuerzo, tipoEntre);
  const pilaresTotales = pilares + pilaresRefuerzo;
  
  const altura = safeNumber(inputAltura.value);
  
  const ladosMotores = obtenerLadosMotores(modulos, modoMotor);

  const { materiales, notas } = generarListaMateriales({
    ancho,
    salida,
    altura,
    modulos,
    tipoMontaje,
    numLamas,
    pilaresTotales,
    ladosMotores,
    mando,
    incluirPilaresRefuerzo
  });

  renderTablaMateriales(materiales, notas);
  
  ultimoMaterialesContext = {
    materiales: { ...materiales },
    ancho,
    salida,
    modulos,
    tipoMontaje,
    numLamas,
    altura
  };

  // Calcular precios
  const config = leerConfigColores();
  precioUltimoCalculo = calcularPrecios(materiales, ultimoMaterialesContext, config);
  renderPreciosUI(precioUltimoCalculo);
  
  // Calcular informes económicos
  const informes = calcularInformesEconomicos(materiales, ultimoMaterialesContext);
  renderInformesEconomicos(informes);
  
  actualizarDatosCabeceraPresupuesto();
}

/**
 * Recalcula precios desde el contexto guardado
 */
export function precioRecalcularDesdeContexto() {
  if (ultimoMaterialesContext && ultimoMaterialesContext.materiales) {
    const config = leerConfigColores();
    precioUltimoCalculo = calcularPrecios(
      ultimoMaterialesContext.materiales, 
      ultimoMaterialesContext, 
      config
    );
    renderPreciosUI(precioUltimoCalculo);
    
    // Recalcular informes económicos
    const informes = calcularInformesEconomicos(
      ultimoMaterialesContext.materiales,
      ultimoMaterialesContext
    );
    renderInformesEconomicos(informes);
  }
}

/**
 * Limpia la UI de precios
 */
export function precioLimpiarUI() {
  precioUltimoCalculo = null;
  ultimoMaterialesContext = null;
  renderPreciosUI(null);
  limpiarInformesEconomicos();
}

// ============================================================================
// FUNCIONES DE RESET
// ============================================================================

/**
 * Resetea el cálculo parcial manteniendo datos de cabecera
 */
export function resetearCalculoParcial() {
  const camposCabecera = new Set(["comercial", "cliente", "refObra"]);
  document
    .querySelectorAll("input[type='text'], input[type='number'], textarea")
    .forEach(el => {
      if (!camposCabecera.has(el.id)) el.value = "";
    });
  document.querySelectorAll("select").forEach(sel => {
    if (sel.options.length && !camposCabecera.has(sel.id)) sel.selectedIndex = 0;
  });

  document.getElementById("chkVariosModulos").checked = false;
  document.getElementById("campoModulos").style.display = "none";
  document.querySelector("input[name='montaje'][value='pilares']").checked = true;
  actualizarCamposMontaje();
  document.querySelector("input[name='modoMotor'][value='todos-izquierda']").checked = true;
  const chkRefuerzo = document.getElementById("chkPilaresRefuerzo");
  if (chkRefuerzo) chkRefuerzo.checked = false;
  document.getElementById("mando").value = "con";
  document.getElementById("pilaresDisplay").textContent = "—";
  actualizarCalibrePilares(null);
  actualizarAvisoRefuerzo("pilares", false);
  document.getElementById("warning").style.display = "none";
  document.getElementById("warning").textContent = "";
  document.getElementById("resumenConfig").innerHTML =
    "<h3>Datos principales</h3><p>Introduce los datos; el esquema y este resumen se irán actualizando automáticamente.</p>";
  document.getElementById("resumenLamas").innerHTML =
    "<h3>Número de lamas según salida</h3><p>Introduce la salida en metros para ver el número orientativo de lamas y los rangos de medida sin despunte.</p>";
  const resumenAvisos = document.getElementById("resumenAvisosMontaje");
  if (resumenAvisos) {
    resumenAvisos.textContent = "";
    resumenAvisos.setAttribute("data-show-pdf", "0");
    resumenAvisos.style.display = "";
  }
  document.getElementById("tablaMateriales").innerHTML = "";
  document.getElementById("motorPorModuloContainer").innerHTML = "";
  document.getElementById("motorPorModuloWrapper").style.display = "none";
  mostrarError("salida", "");
  mostrarError("ancho", "");
  mostrarError("altura", "");
  salidaValida = false;
  anchoValido = false;
  renderDiagram(null, null, null, null, null, null, null, false);
  const selectorDoc = document.getElementById("selectorDocumento");
  mostrarSoloDocumento("");
  if (selectorDoc) selectorDoc.value = "presupuesto";
  actualizarVisibilidadInformes();
  document.getElementById("campoColorGlobal").style.display = "block";
  document.getElementById("campoColorLamas").style.display = "none";
  document.getElementById("campoColorPerimetro").style.display = "none";
  actualizarCamposColorPergola();
  precioLimpiarUI();
}

/**
 * Resetea completamente la aplicación
 */
export function resetear() {
  resetearCalculoParcial();
  document.getElementById("budgetInfo").style.display = "none";
  document.getElementById("comercial").value = "";
  document.getElementById("cliente").value = "";
  document.getElementById("refObra").value = "";
  const colorMono = document.querySelector("input[name='colorModo'][value='mono']");
  if (colorMono) colorMono.checked = true;
  document.getElementById("colorGlobal").value = "blanco";
  document.getElementById("colorLamas").value = "blanco";
  document.getElementById("colorPerimetro").value = "blanco";
  document.getElementById("refAcabadoGlobal").value = "";
  document.getElementById("refAcabadoLamas").value = "";
  document.getElementById("refAcabadoPerimetro").value = "";
  const selectorDoc = document.getElementById("selectorDocumento");
  const descInput = document.getElementById("descuentoAluminio");
  if (descInput) descInput.value = "0";
  mostrarSoloDocumento("");
  selectorDoc.value = "presupuesto";
  actualizarVisibilidadInformes();
  document.getElementById("campoColorGlobal").style.display = "block";
  document.getElementById("campoColorLamas").style.display = "none";
  document.getElementById("campoColorPerimetro").style.display = "none";
  actualizarCamposColorPergola();
  precioLimpiarUI();
}

/**
 * Inicializa el número de presupuesto
 */
export function inicializarNumeroPresupuesto() {
  const refSpan = document.getElementById("refCode");
  if (refSpan && !refSpan.textContent.trim()) {
    refSpan.textContent = generarCodigoRef();
  }
}

// ============================================================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ============================================================================

/**
 * Configura todos los event listeners de la aplicación
 */
export function configurarEventListeners() {
  // Dimensiones
  document.getElementById("salida").addEventListener("input", actualizarConfiguracionRapida);
  document.getElementById("ancho").addEventListener("input", actualizarConfiguracionRapida);
  document.getElementById("altura").addEventListener("input", actualizarConfiguracionRapida);

  // Módulos
  document.getElementById("chkVariosModulos").addEventListener("change", () => {
    const campoMod = document.getElementById("campoModulos");
    campoMod.style.display = document.getElementById("chkVariosModulos").checked ? "block" : "none";
    actualizarOpcionesMotorSegunModulos();
    actualizarMotorPorModuloUI();
    actualizarConfiguracionRapida();
  });

  document.getElementById("modulos").addEventListener("input", () => {
    actualizarOpcionesMotorSegunModulos();
    actualizarMotorPorModuloUI();
    actualizarConfiguracionRapida();
  });

  // Montaje
  document.getElementById("grupoMontaje").addEventListener("change", () => {
    actualizarCamposMontaje();
    actualizarConfiguracionRapida();
  });

  document.getElementById("tipoEntreParedes").addEventListener("change", actualizarConfiguracionRapida);
  document.getElementById("posicionPared").addEventListener("change", actualizarConfiguracionRapida);
  document.getElementById("chkPilaresRefuerzo").addEventListener("change", actualizarConfiguracionRapida);

  // Datos presupuesto
  document.getElementById("comercial").addEventListener("input", actualizarDatosCabeceraPresupuesto);
  document.getElementById("cliente").addEventListener("input", actualizarDatosCabeceraPresupuesto);
  document.getElementById("refObra").addEventListener("input", actualizarDatosCabeceraPresupuesto);

  // Motores
  document.getElementById("grupoModoMotor").addEventListener("change", () => {
    actualizarMotorPorModuloUI();
    actualizarConfiguracionRapida();
  });

  document.getElementById("mando").addEventListener("change", actualizarConfiguracionRapida);

  // Colores
  document.querySelectorAll("input[name='colorModo']").forEach(r => {
    r.addEventListener("change", () => {
      actualizarCamposColorPergola();
      precioRecalcularDesdeContexto();
    });
  });
  
  ["colorGlobal", "colorLamas", "colorPerimetro"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", precioRecalcularDesdeContexto);
  });
  
  ["refAcabadoGlobal", "refAcabadoLamas", "refAcabadoPerimetro"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", precioRecalcularDesdeContexto);
  });
  
  const descuentoInput = document.getElementById("descuentoAluminio");
  if (descuentoInput) descuentoInput.addEventListener("input", precioRecalcularDesdeContexto);

  // Documentos
  const selectorDocumento = document.getElementById("selectorDocumento");
  if (selectorDocumento) {
    selectorDocumento.addEventListener("change", actualizarVisibilidadInformes);
  }

  // Botones
  const btnRecalcular = document.getElementById("btnRecalcular");
  if (btnRecalcular) btnRecalcular.addEventListener("click", resetearCalculoParcial);

  const btnNuevoPresupuesto = document.getElementById("btnNuevoPresupuesto");
  if (btnNuevoPresupuesto) {
    btnNuevoPresupuesto.addEventListener("click", () => {
      window.location.href = window.location.href.split("#")[0];
    });
  }
}

// ============================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================================================

/**
 * Inicializa la aplicación
 */
export function inicializarApp() {
  // Mostrar versión
  const versionLabel = document.getElementById("versionLabel");
  if (versionLabel) versionLabel.textContent = `Versión ${VERSION}`;

  // Configurar event listeners
  configurarEventListeners();

  // Inicialización
  desactivarAutocompletado();
  resetear();
  inicializarNumeroPresupuesto();

  // Manejar navegación con caché
  window.addEventListener("pageshow", evt => {
    if (evt.persisted) {
      resetear();
      inicializarNumeroPresupuesto();
    }
  });
}

// Helper function for safe number conversion (duplicated here for self-contained module)
function safeNumber(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}
