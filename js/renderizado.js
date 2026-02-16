/**
 * RENDERIZADO Y ACTUALIZACIÓN DE INTERFAZ
 * =================================================================
 * Este módulo contiene las funciones relacionadas con:
 * - Renderizado de diagramas SVG
 * - Actualización de resúmenes y tablas
 * - Visualización de datos en la UI
 */

// Importar constantes y funciones necesarias
import { 
  LAMAS_TABLE,
  DESCRIPCIONES,
  DESCRIPCIONES_MONT,
  CALIBRE_PILAR_IA
} from './calculosPergola.js';

import { TIPO_MATERIAL } from './config.js';
import { precioFormatearEuro } from './utils.js';
import { requiereRefuerzo } from './calculosPergola.js';

// ============================================================================
// RENDERIZADO DE DIAGRAMA SVG
// ============================================================================

/**
 * Renderiza el diagrama SVG de la pérgola con todas sus configuraciones
 * @param {number} ancho - Ancho en metros
 * @param {number} salida - Salida en metros
 * @param {number} modulos - Número de módulos
 * @param {string} tipoMontaje - Tipo de montaje
 * @param {number} pilares - Número de pilares
 * @param {Array<string>} moduleSides - Lados de motores por módulo
 * @param {number} numLamas - Número de lamas
 * @param {boolean} incluirPilaresRefuerzo - Si incluir pilares de refuerzo
 */
export function renderDiagram(
  ancho, 
  salida, 
  modulos, 
  tipoMontaje, 
  pilares, 
  moduleSides, 
  numLamas, 
  incluirPilaresRefuerzo = false
) {
  const svg = document.getElementById("pergolaSvg");
  const caption = document.getElementById("diagramCaption");
  svg.innerHTML = "";
  const pdfSection = document.getElementById("pdfDiagramSection");

  if (!ancho || !salida) {
    caption.textContent = "Introduce largo/salida y ancho; el esquema se actualizará automáticamente.";
    const pdfSvg = document.getElementById("pergolaSvgPdf");
    if (pdfSvg) pdfSvg.innerHTML = "";
    if (pdfSection) pdfSection.style.display = "none";
    return;
  }

  const W = 340, H = 240;
  const maxRectW = 270, maxRectH = 170;
  const scale = Math.min(maxRectW / ancho, maxRectH / salida);
  const rectW = ancho * scale;
  const rectH = salida * scale;
  const x0 = (W - rectW) / 2;
  const y0 = (H - rectH) / 2;
  const x1 = x0 + rectW;
  const y1 = y0 + rectH;

  const partes = modulos && modulos > 1 ? modulos : 1;
  const dx = rectW / partes;

  const tipoEntre = document.getElementById("tipoEntreParedes")?.value || "laterales";
  const posicionPared = document.getElementById("posicionPared")?.value || "trasera";
  const tieneParedHorizontal = tipoMontaje === "pared-ancho" || (tipoMontaje === "entre-paredes" && tipoEntre === "frontales");
  const tieneParedVertical = tipoMontaje === "pared-largo" || (tipoMontaje === "entre-paredes" && tipoEntre === "laterales");

  let elements = "";

  // Paredes
  if (tipoMontaje === "pared-ancho") {
    const paredDelantera = posicionPared === "delantera";
    const yWall = paredDelantera ? (y1 + 2) : (y0 - 8);
    elements += `<rect x="${x0 - 4}" y="${yWall}" width="${rectW + 8}" height="6" fill="#9ca3af" />`;
  } else if (tipoMontaje === "pared-largo") {
    const paredDerecha = posicionPared === "derecha";
    const xWall = paredDerecha ? (x1 + 2) : (x0 - 8);
    elements += `<rect x="${xWall}" y="${y0 - 4}" width="6" height="${rectH + 8}" fill="#9ca3af" />`;
  } else if (tipoMontaje === "entre-paredes") {
    if (tipoEntre === "frontales") {
      elements += `<rect x="${x0 - 4}" y="${y0 - 8}" width="${rectW + 8}" height="6" fill="#9ca3af" />`;
      elements += `<rect x="${x0 - 4}" y="${y1 + 2}" width="${rectW + 8}" height="6" fill="#9ca3af" />`;
    } else {
      elements += `<rect x="${x0 - 8}" y="${y0 - 4}" width="6" height="${rectH + 8}" fill="#9ca3af" />`;
      elements += `<rect x="${x1 + 2}" y="${y0 - 4}" width="6" height="${rectH + 8}" fill="#9ca3af" />`;
    }
  }

  // Contorno
  elements += `<rect x="${x0}" y="${y0}" width="${rectW}" height="${rectH}" rx="8" fill="#ffffff" stroke="#111827" stroke-width="1.3" />`;

  // Lamas
  const lamas = Math.min(numLamas || 12, 40);
  const dy = rectH / (lamas + 1);
  for (let i = 1; i <= lamas; i++) {
    const y = y0 + i * dy;
    if (partes === 1) {
      elements += `<line x1="${x0 + 6}" y1="${y.toFixed(1)}" x2="${x1 - 6}" y2="${y.toFixed(1)}" stroke="#93c5fd" stroke-width="1"/>`;
    } else {
      for (let j = 0; j < partes; j++) {
        const segX0 = x0 + j * dx;
        const segX1 = segX0 + dx;
        elements += `<line x1="${(segX0 + 6).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(segX1 - 6).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#93c5fd" stroke-width="1"/>`;
      }
    }
  }

  // Divisores
  if (partes > 1) {
    for (let i = 1; i < partes; i++) {
      const x = x0 + i * dx;
      elements += `<line x1="${x.toFixed(1)}" y1="${y0}" x2="${x.toFixed(1)}" y2="${y1}" stroke="#9ca3af" stroke-width="1.2"/>`;
    }
  }

  // Pilares
  const pillarSize = 7;
  const half = pillarSize / 2;
  const pillarPoints = [];
  if (pilares > 0) {
    if (tipoMontaje === "pilares") {
      for (let i = 0; i <= partes; i++) {
        const x = x0 + i * dx;
        pillarPoints.push({ x, y: y0 - 2 });
        pillarPoints.push({ x, y: y1 + 2 });
      }
    } else if (tipoMontaje === "pared-ancho") {
      const paredDelantera = posicionPared === "delantera";
      const pyLibre = paredDelantera ? (y0 - 2) : (y1 + 2);
      for (let i = 0; i <= partes; i++) {
        const x = x0 + i * dx;
        pillarPoints.push({ x, y: pyLibre });
      }
    } else if (tipoMontaje === "pared-largo") {
      const paredDerecha = posicionPared === "derecha";
      const xLibre = paredDerecha ? (x0 - 2) : (x1 + 2);
      pillarPoints.push({ x: xLibre, y: y0 - 2 });
      pillarPoints.push({ x: xLibre, y: y1 + 2 });
      if (partes > 1) {
        for (let i = 1; i < partes; i++) {
          const xDiv = x0 + i * dx;
          pillarPoints.push({ x: xDiv, y: y0 - 2 });
          pillarPoints.push({ x: xDiv, y: y1 + 2 });
        }
      }
    } else if (tipoMontaje === "entre-paredes" && tipoEntre === "laterales") {
      if (partes > 1) {
        for (let i = 1; i < partes; i++) {
          const x = x0 + i * dx;
          pillarPoints.push({ x, y: y0 - 2 });
          pillarPoints.push({ x, y: y1 + 2 });
        }
      }
    }
  }

  const refuerzoPoints = [];
  if (incluirPilaresRefuerzo && requiereRefuerzo(tipoMontaje, tipoEntre)) {
    if (tipoMontaje === "pared-largo") {
      const paredDerecha = posicionPared === "derecha";
      const xWall = paredDerecha ? (x1 + 2) : (x0 - 2);
      refuerzoPoints.push({ x: xWall, y: y0 - 2 });
      refuerzoPoints.push({ x: xWall, y: y1 + 2 });
    } else if (tipoMontaje === "entre-paredes" && tipoEntre === "laterales") {
      const leftX = x0 - 2;
      const rightX = x1 + 2;
      refuerzoPoints.push({ x: leftX, y: y0 - 2 });
      refuerzoPoints.push({ x: leftX, y: y1 + 2 });
      refuerzoPoints.push({ x: rightX, y: y0 - 2 });
      refuerzoPoints.push({ x: rightX, y: y1 + 2 });
    }
  }

  pillarPoints.forEach(p => {
    elements += `<rect x="${(p.x - half).toFixed(1)}" y="${(p.y - half).toFixed(1)}" width="${pillarSize}" height="${pillarSize}" fill="#16a34a"/>`;
  });
  refuerzoPoints.forEach(p => {
    elements += `<rect x="${(p.x - half).toFixed(1)}" y="${(p.y - half).toFixed(1)}" width="${pillarSize}" height="${pillarSize}" fill="#facc15" stroke="#92400e" stroke-width="1"/>`;
  });

  // Motores (arriba, frente)
  const motorY = y0 - 12;
  const motorWidth = 18;
  const motorHeight = 4;
  const sides = Array.isArray(moduleSides) && moduleSides.length
    ? moduleSides
    : new Array(partes).fill("izquierda");

  for (let i = 0; i < partes; i++) {
    const segX0 = x0 + i * dx;
    const segX1 = segX0 + dx;
    const side = sides[i] === "derecha" ? "derecha" : "izquierda";
    const motorXCenter = side === "izquierda" ? segX0 + 12 : segX1 - 12;
    const mx = motorXCenter - motorWidth / 2;
    const my = motorY - motorHeight / 2;
    elements += `<rect x="${mx.toFixed(1)}" y="${my.toFixed(1)}" width="${motorWidth}" height="${motorHeight}" rx="2" fill="#f97316"/>`;
    if (i === 0) {
      elements += `<text x="${motorXCenter.toFixed(1)}" y="${(motorY - 6).toFixed(1)}" text-anchor="middle" font-size="9" fill="#374151">Motor</text>`;
    }
  }

  // Flechas dimensiones
  const arrowY = Math.min(H - 28, y1 + (tieneParedHorizontal ? 26 : 20));
  elements += `<line x1="${x0 + 20}" y1="${arrowY}" x2="${x1 - 20}" y2="${arrowY}" stroke="#4b5563" stroke-width="1.2" marker-start="url(#arrowHead)" marker-end="url(#arrowHead)"/>`;
  elements += `<text x="${(x0 + rectW / 2).toFixed(1)}" y="${(arrowY + 10).toFixed(1)}" text-anchor="middle" font-size="9" fill="#4b5563">Ancho (dirección de lamas)</text>`;

  const arrowX = Math.max(14 + (tieneParedVertical ? 8 : 0), x0 - (tieneParedVertical ? 22 : 14));
  elements += `<line x1="${arrowX}" y1="${y0 + 6}" x2="${arrowX}" y2="${y1 - 6}" stroke="#4b5563" stroke-width="1.2" marker-start="url(#arrowHead)" marker-end="url(#arrowHead)"/>`;
  const textX = Math.max(12 + (tieneParedVertical ? 8 : 0), arrowX - 2);
  const textY = y0 + rectH / 2;
  elements += `<text x="${textX}" y="${textY}" text-anchor="middle" font-size="9" fill="#4b5563" transform="rotate(-90 ${textX} ${textY})">Largo / salida</text>`;

  const defs = `
    <defs>
      <marker id="arrowHead" viewBox="0 0 10 10" refX="7" refY="5"
        markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#4b5563" />
      </marker>
    </defs>
  `;

  svg.innerHTML = defs + elements;
  caption.textContent = "";

  const pdfSvg = document.getElementById("pergolaSvgPdf");
  if (pdfSvg) {
    pdfSvg.setAttribute("viewBox", "0 0 340 240");
    pdfSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    pdfSvg.setAttribute("width", "300");
    pdfSvg.setAttribute("height", "212");
    pdfSvg.innerHTML = svg.innerHTML;
  }
}

// ============================================================================
// ACTUALIZACIÓN DE RESÚMENES
// ============================================================================

/**
 * Actualiza la tabla de resumen de lamas en la UI
 * @param {number} salida - Salida en metros
 */
export function actualizarResumenLamasUI(salida) {
  const cont = document.getElementById("resumenLamas");
  if (!salida) {
    cont.innerHTML = `
      <h3>Número de lamas según salida</h3>
      <p>Introduce la salida en metros para ver el número orientativo de lamas y los rangos de medida sin despunte.</p>
    `;
    return;
  }
  
  const fila = LAMAS_TABLE.find(f => salida >= f.min && salida <= f.max) || 
               LAMAS_TABLE[LAMAS_TABLE.length - 1];
  
  if (!fila) return;

  const anterior = LAMAS_TABLE.find(f => f.n === fila.n - 1) || fila;
  const siguiente = LAMAS_TABLE.find(f => f.n === fila.n + 1) || fila;

  cont.innerHTML = `
    <h3>Número de lamas según salida</h3>
    <p>Para una salida de <strong>${salida.toFixed(2)} m</strong> corresponden aproximadamente <strong>${fila.n} lamas</strong>.</p>
    <table>
      <thead>
        <tr>
          <th>Lamas</th>
          <th>Salida mínima [m]</th>
          <th>Salida máxima [m]</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${anterior.n}</td>
          <td>${anterior.min.toFixed(3)}</td>
          <td>${anterior.max.toFixed(3)}</td>
        </tr>
        <tr>
          <td><strong>${fila.n}</strong></td>
          <td><strong>${fila.min.toFixed(3)}</strong></td>
          <td><strong>${fila.max.toFixed(3)}</strong></td>
        </tr>
        <tr>
          <td>${siguiente.n}</td>
          <td>${siguiente.min.toFixed(3)}</td>
          <td>${siguiente.max.toFixed(3)}</td>
        </tr>
      </tbody>
    </table>
    <p class="table-footnote">Las medidas intermedias dentro de cada rango también son válidas. Para salidas máximas (6,00 m) se usan ${LAMAS_TABLE[LAMAS_TABLE.length - 1].n} lamas.</p>
  `;
}

/**
 * Actualiza el resumen de configuración de la pérgola
 */
export function actualizarResumenConfig(
  ancho, 
  salida, 
  altura, 
  modulos, 
  tipoMontaje, 
  pilares, 
  numLamasTabla, 
  modoMotor, 
  ladosMotores, 
  mando
) {
  const cont = document.getElementById("resumenConfig");
  const motoresTexto =
    modoMotor === "personalizado"
      ? "Motores por módulo: " +
        ladosMotores.map((l, i) => `M${i + 1}:${l === "derecha" ? "Der" : "Izq"}`).join(", ")
      : `Configuración: ${modoMotor === "todos-derecha" ? "todos a derecha" : "todos a izquierda"}`;

  const mandoTexto = mando === "sin"
    ? "Sin mando incluido (se definirá aparte)."
    : "Con mando (1 ud. por instalación).";

  cont.innerHTML = `
    <h3>Datos principales</h3>
    <ul class="summary-list">
      <li><strong>Largo/salida:</strong> ${salida ? salida.toFixed(2) + " m" : "—"} · <strong>Ancho:</strong> ${ancho ? ancho.toFixed(2) + " m" : "—"} · <strong>Altura libre:</strong> ${altura ? altura.toFixed(2) + " m" : "—"}</li>
      <li><strong>Módulos:</strong> ${modulos}</li>
      <li><strong>Tipo de montaje:</strong> ${DESCRIPCIONES_MONT[tipoMontaje] || ""}</li>
      <li><strong>Nº pilares calculados:</strong> ${pilares}</li>
      <li><strong>Motores:</strong> ${motoresTexto}</li>
      <li><strong>Número de lamas (tabla):</strong> ${numLamasTabla || "no determinado"}</li>
      <li><strong>Mando:</strong> ${mandoTexto}</li>
    </ul>
  `;
}

/**
 * Actualiza el display del calibre de pilares
 * @param {number} pilaresCalculados - Número de pilares
 */
export function actualizarCalibrePilares(pilaresCalculados) {
  const el = document.getElementById("calibrePilaresDisplay");
  if (!el) return;
  const texto = pilaresCalculados && pilaresCalculados > 0
    ? `Calibre de los pilares: ${CALIBRE_PILAR_IA}`
    : "Calibre de los pilares: —";
  el.textContent = texto;
}

// ============================================================================
// RENDERIZADO DE TABLAS
// ============================================================================

/**
 * Renderiza la tabla de materiales separando perfiles y accesorios
 * @param {object} materiales - Materiales necesarios
 * @param {object} notas - Notas adicionales por material
 */
export function renderTablaMateriales(materiales, notas = {}) {
  const tbody = document.getElementById("tablaMateriales");
  tbody.innerHTML = "";

  const refs = Object.keys(materiales).sort();
  if (!refs.length) return;

  const perfiles = [];
  const accesorios = [];

  refs.forEach(ref => {
    const tipo = TIPO_MATERIAL[ref] || "accesorio";
    (tipo === "perfil" ? perfiles : accesorios).push(ref);
  });

  const addSection = (titulo, listaRefs) => {
    if (!listaRefs.length) return;
    const trTitulo = document.createElement("tr");
    trTitulo.className = "section-row";
    trTitulo.innerHTML = `<td colspan="4"><strong>${titulo}</strong></td>`;
    tbody.appendChild(trTitulo);

    listaRefs.forEach(ref => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ref}</td>
        <td>${DESCRIPCIONES[ref] || ""}</td>
        <td>${materiales[ref]}</td>
        <td>${notas[ref] || ""}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  addSection("Perfiles de aluminio", perfiles);
  addSection("Accesorios y herrajes", accesorios);
}

/**
 * Renderiza el resumen de precios en la UI
 * @param {object} result - Resultado del cálculo de precios
 */
export function renderPreciosUI(result) {
  const resumenWeb = document.getElementById("preciosResumenWeb");
  const resumenPdf = document.getElementById("preciosResumenPdf");
  const detalleWeb = document.getElementById("tablaDetallePreciosWeb");
  const detallePdf = document.getElementById("preciosDetallePdf");

  if (resumenWeb) resumenWeb.innerHTML = "";
  if (resumenPdf) resumenPdf.innerHTML = "";
  if (detalleWeb) detalleWeb.innerHTML = "";
  if (detallePdf) detallePdf.innerHTML = "";

  if (!result) return;

  const resumenHtml = `
    <div class="price-totals">
      <div class="price-chip"><span class="label">Subtotal aluminio</span>${precioFormatearEuro(result.perfiles.subtotalSinDto)}</div>
      <div class="price-chip"><span class="label">Dto. aluminio</span>${precioFormatearEuro(result.perfiles.descuento)}</div>
      <div class="price-chip"><span class="label">Total aluminio</span>${precioFormatearEuro(result.perfiles.subtotalConDto)}</div>
      <div class="price-chip"><span class="label">Total accesorios</span>${precioFormatearEuro(result.accesorios.total)}</div>
      <div class="price-chip"><span class="label">Total material</span>${precioFormatearEuro(result.totalMaterial)}</div>
    </div>
  `;

  if (resumenWeb) resumenWeb.innerHTML = resumenHtml;
  if (resumenPdf) resumenPdf.innerHTML = resumenHtml;

  const renderDetalle = (tbody, detalle) => {
    detalle.forEach(item => {
      const barras = item.barras
        ? Object.entries(item.barras)
            .map(([l, n]) => `${(Number(l) / 1000).toFixed(2)} m × ${n}`)
            .join(", ")
        : "—";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.ref}</td>
        <td>${item.descripcion || ""}</td>
        <td>${item.acabado || ""}</td>
        <td>${barras}</td>
        <td>${item.barras ? `${(item.desperdicio / 1000).toFixed(2)} m` : "—"}</td>
        <td>${precioFormatearEuro(item.coste)}</td>`;
      tbody.appendChild(tr);
    });
  };

  if (detalleWeb) renderDetalle(detalleWeb, result.detalle);
  if (detallePdf) {
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Ref.</th><th>Descripción</th><th>Acabado</th><th>Barras</th><th>Desperdicio</th><th>Coste</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tb = table.querySelector("tbody");
    renderDetalle(tb, result.detalle);
    detallePdf.appendChild(table);
  }
}
