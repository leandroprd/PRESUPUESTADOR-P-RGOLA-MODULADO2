/**
 * ARCHIVO PRINCIPAL - PRESUPUESTADOR PÉRGOLA BIOCLIMÁTICA
 * =================================================================
 * Este es el punto de entrada de la aplicación.
 * Importa todos los módulos y arranca la aplicación.
 */

// ============================================================================
// IMPORTAR TODOS LOS MÓDULOS
// ============================================================================

// Configuración y constantes
import { 
  VERSION,
  precio_perfiles,
  precio_accesorios,
  TIPO_MATERIAL,
  LAMAS_TABLE,
  MARGEN_PUNTA_MM,
  MERMA_CORTE_MM
} from './config.js';

// Utilidades
import {
  safeNumber,
  precioFormatearEuro,
  sanitizeForFilename,
  generarCodigoRef,
  generarFechaFormateada,
  validarSalida,
  validarAncho,
  validarAltura,
  mostrarError,
  desactivarAutocompletado,
  obtenerModulos,
  mostrarSoloDocumento,
  leerConfigColores,
  leerReferenciasAcabado,
  elegirAcabado,
  acabadoATexto,
  elegirReferenciaAcabado
} from './utils.js';

// Cálculos de pérgola
import {
  CALIBRE_PILAR_IA,
  AVISO_REFUERZO_TEXTO_PARED,
  AVISO_REFUERZO_TEXTO_ENTRE,
  DESCRIPCIONES_MONT,
  DESCRIPCIONES_MONT_DETALLADAS,
  DESCRIPCIONES,
  calculadores_longitud,
  buscarFilaLamas,
  calcularNumeroLamas,
  requiereRefuerzo,
  contarPilaresRefuerzo,
  calcularPilares,
  obtenerLadosMotores,
  generarListaMateriales
} from './calculosPergola.js';

// Gestión de precios
import {
  generarPiezasPerfiles,
  optimizarBarras,
  calcularPerfiles,
  calcularAccesorios,
  calcularPrecios
} from './precios.js';

// Renderizado de interfaz
import {
  renderDiagram,
  actualizarResumenLamasUI,
  actualizarResumenConfig,
  actualizarCalibrePilares,
  renderTablaMateriales,
  renderPreciosUI
} from './renderizado.js';

// Informes económicos
import {
  calcularInformesEconomicos,
  renderInformesEconomicos,
  limpiarInformesEconomicos,
  obtenerUltimoInforme,
  obtenerResumenLineas,
  obtenerTotales,
  obtenerDetallePerfiles,
  obtenerDetalleAccesorios
} from './informes.js';

// Sistema de PDFs (con modal de vista previa)
import {
  inicializarSistemaPDF,
  abrirVistaPreviaPDF,
  cerrarModal,
  descargarPDFDesdeModal,
  compartirPDFDesdeModal
} from './pdf.js';

// Inicialización y eventos
import {
  actualizarCamposMontaje,
  actualizarOpcionesMotorSegunModulos,
  actualizarMotorPorModuloUI,
  actualizarAvisoRefuerzo,
  actualizarCamposColorPergola,
  actualizarDatosCabeceraPresupuesto,
  actualizarVisibilidadInformes,
  actualizarConfiguracionRapida,
  calcularMateriales,
  precioRecalcularDesdeContexto,
  precioLimpiarUI,
  resetearCalculoParcial,
  resetear,
  inicializarNumeroPresupuesto,
  configurarEventListeners,
  inicializarApp
} from './app.js';

// ============================================================================
// EXPORTAR API GLOBAL (opcional, para acceso desde consola o debugging)
// ============================================================================

window.PresupuestadorAPI = {
  // Versión
  version: VERSION,
  
  // Funciones principales
  calcularMateriales,
  calcularPrecios,
  calcularInformesEconomicos,
  
  // Generación de PDFs
  abrirVistaPreviaPDF,
  cerrarModal,
  descargarPDFDesdeModal,
  compartirPDFDesdeModal,
  
  // Utilidades
  precioFormatearEuro,
  generarCodigoRef,
  
  // Informes
  obtenerUltimoInforme,
  obtenerResumenLineas,
  obtenerTotales,
  
  // Estado
  resetear,
  resetearCalculoParcial,
  
  // Datos
  LAMAS_TABLE,
  precio_perfiles,
  precio_accesorios,
  DESCRIPCIONES
};

// ============================================================================
// INICIAR LA APLICACIÓN
// ============================================================================

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    inicializarApp();
    inicializarSistemaPDF();
  });
} else {
  // DOM ya está listo
  inicializarApp();
  inicializarSistemaPDF();
}

// Log de inicio
console.log(`%c🏗️ Presupuestador Pérgola Bioclimática v${VERSION}`, 'color: #0054a6; font-size: 16px; font-weight: bold;');
console.log('%cAplicación cargada correctamente', 'color: #16a34a;');
console.log('%cAPI disponible en: window.PresupuestadorAPI', 'color: #64748b; font-style: italic;');