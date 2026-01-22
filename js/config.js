/**
 * CONFIGURACIÓN Y CONSTANTES DEL PRESUPUESTADOR PÉRGOLA DOHA SUN
 * =================================================================
 * Este módulo contiene todas las constantes relacionadas con:
 * - Precios de perfiles de aluminio
 * - Precios de accesorios y componentes
 * - Calculadores de longitud por referencia
 * - Tipos de materiales
 * - Versión de la aplicación
 */

// ============================================================================
// VERSIÓN DE LA APLICACIÓN
// ============================================================================
export const VERSION = "1.0.0";

// ============================================================================
// TIPOS DE MATERIAL
// ============================================================================
export const TIPO_MATERIAL = {
  "6391": "perfil",
  "7616": "perfil",
  "6436": "perfil",
  "6211": "perfil",
  "6211B": "perfil",
  "6214": "perfil",
  "6816": "perfil",
  "6867": "perfil",
  "9125": "perfil",
  "6212": "perfil",
  "6218": "perfil",
  "6217": "perfil",
  "5960": "perfil",
  "7985B": "perfil",
  "1015B": "perfil",
  "7497": "perfil",
  "6323": "perfil",
  "6863": "perfil",
  "PB0038": "accesorio",
  "PB0039": "accesorio",
  "PB0033": "accesorio",
  "PB0032": "accesorio",
  "PB0035": "accesorio",
  "PB0034": "accesorio",
  "PB0036": "accesorio",
  "PB0037": "accesorio",
  "PB0005": "accesorio",
  "PB0044": "accesorio",
  "PB0015": "accesorio",
  "PB0042": "accesorio",
  "PB0043": "accesorio",
  "PB0041": "accesorio",
  "PB0040": "accesorio",
  "PB0009": "accesorio",
  "PB0030": "accesorio",
  "PB0031": "accesorio",
  "PB4505": "accesorio",
  "MO4004": "accesorio",
  "TM A5369": "accesorio",
  "PE 5254": "accesorio",
  "TA2010": "accesorio",
  "PB0050": "accesorio",
  "PB0051": "accesorio",
  "PB0052": "accesorio",
  "PB0053": "accesorio",
  "PB HOBLO": "accesorio",
  "TM 5200": "accesorio",
  "TM 5201": "accesorio",
  "KI CIPLS": "accesorio",
  "KI CIFL": "accesorio",
  "KI FL4W": "accesorio",
  "PB0060": "accesorio",
  "GO 5248": "accesorio",
  "TM A5367": "accesorio"
};

// ============================================================================
// PRECIOS DE PERFILES DE ALUMINIO
// ============================================================================
export const precio_perfiles = {
  "6391": {
    ref: "6391",
    nombre: "Larguero lateral Doha",
    grupo_color: "perimetro",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 97.73, textura: 102.19, color: 103.32, anodizado: 100.79, nature: 106.96 },
    peso_kg_m: 7.467,
    perimetro_total_mm: 178.25,
    perimetro_ext_mm: 96.73,
    perimetro_int_mm: 81.52
  },
  "7616": {
    ref: "7616",
    nombre: "Perfil trasero Doha",
    grupo_color: "perimetro",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 25.88, textura: 27.42, color: 27.74, anodizado: 27.31, nature: 30.35 },
    peso_kg_m: 1.913,
    perimetro_total_mm: 65.9,
    perimetro_ext_mm: 35.2,
    perimetro_int_mm: 30.7
  },
  "6436": {
    ref: "6436",
    nombre: "Travesaño lateral Doha doble",
    grupo_color: "perimetro",
    longitudes_barra: [4.0, 6.5],
    precio_m: { blanco: 111.04, textura: 116.1, color: 117.4, anodizado: 115.32, nature: 128.14 },
    peso_kg_m: 8.186,
    perimetro_total_mm: 171.5,
    perimetro_ext_mm: 71.8,
    perimetro_int_mm: 99.7
  },
  "6211": {
    ref: "6211",
    nombre: "Canalón Doha",
    grupo_color: "perimetro",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 40.82, textura: 42.88, color: 43.38, anodizado: 43.07, nature: 47.95 },
    peso_kg_m: 3.019,
    perimetro_total_mm: 106.25,
    perimetro_ext_mm: 58.33,
    perimetro_int_mm: 47.92
  },
  "6211B": {
    ref: "6211B",
    nombre: "Canalón Doha FV",
    grupo_color: "perimetro",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 40.82, textura: 42.88, color: 43.38, anodizado: 43.07, nature: 47.95 },
    peso_kg_m: 3.019,
    perimetro_total_mm: 106.25,
    perimetro_ext_mm: 58.33,
    perimetro_int_mm: 47.92
  },
  "6214": {
    ref: "6214",
    nombre: "Soporte lama Doha",
    grupo_color: "perimetro",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 37.05, textura: 38.93, color: 39.37, anodizado: 38.96, nature: 43.09 },
    peso_kg_m: 2.738,
    perimetro_total_mm: 100.25,
    perimetro_ext_mm: 54.33,
    perimetro_int_mm: 45.92
  },
  "6816": {
    ref: "6816",
    nombre: "Lama Doha",
    grupo_color: "lamas",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 26.66, textura: 28.29, color: 28.66, anodizado: 31.48, nature: 37.47 },
    peso_kg_m: 1.906,
    perimetro_total_mm: 62.73,
    perimetro_ext_mm: 0,
    perimetro_int_mm: 62.73
  },
  "6867": {
    ref: "6867",
    nombre: "Lama motor 230 mm Doha",
    grupo_color: "lamas",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 26.66, textura: 28.29, color: 28.66, anodizado: 31.48, nature: 37.47 },
    peso_kg_m: 1.906,
    perimetro_total_mm: 62.73,
    perimetro_ext_mm: 0,
    perimetro_int_mm: 62.73
  },
  "9125": {
    ref: "9125",
    nombre: "Lama motor 280 mm Doha",
    grupo_color: "lamas",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 28.16, textura: 29.87, color: 30.26, anodizado: 33.24, nature: 39.58 },
    peso_kg_m: 2.013,
    perimetro_total_mm: 66.23,
    perimetro_ext_mm: 0,
    perimetro_int_mm: 66.23
  },
  "6215": {
    ref: "6215",
    nombre: "Perfil portante Doha",
    grupo_color: "perimetro",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 78.52, textura: 81.34, color: 82.04, anodizado: 80.96, nature: 86.74 },
    peso_kg_m: 5.955,
    perimetro_total_mm: 117.25,
    perimetro_ext_mm: 64.27,
    perimetro_int_mm: 52.98
  },
  "6212": {
    ref: "6212",
    nombre: "Perfil frontal Doha",
    grupo_color: "perimetro",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 0, textura: 0, color: 0, anodizado: 0, nature: 0 },
    peso_kg_m: 3.403,
    perimetro_total_mm: 96.98,
    perimetro_ext_mm: 0,
    perimetro_int_mm: 96.98
  },
  "6218": {
    ref: "6218",
    nombre: "Lama compensadora Doha",
    grupo_color: "lamas",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 19.56, textura: 20.84, color: 21.16, anodizado: 23.56, nature: 28.37 },
    peso_kg_m: 1.395,
    perimetro_total_mm: 53.38,
    perimetro_ext_mm: 0,
    perimetro_int_mm: 53.38
  },
  "6217": {
    ref: "6217",
    nombre: "Soporte lama compensación",
    grupo_color: "lamas",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 3.74, textura: 4.03, color: 4.1, anodizado: 4.63, nature: 5.7 },
    peso_kg_m: 0.261,
    perimetro_total_mm: 11.87,
    perimetro_ext_mm: 0,
    perimetro_int_mm: 11.87
  },
  "5960": {
    ref: "5960",
    nombre: "Tapeta 22 mm clipada",
    grupo_color: "lamas",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 1.62, textura: 1.86, color: 1.92, anodizado: 2.37, nature: 3.27 },
    peso_kg_m: 0.095,
    perimetro_total_mm: 10,
    perimetro_ext_mm: 10,
    perimetro_int_mm: 0
  },
  "7985B": {
    ref: "7985B",
    nombre: "Soporte tubo mecánica",
    grupo_color: "perimetro",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 14.04, textura: 14.65, color: 14.8, anodizado: 15.21, nature: 16.93 },
    peso_kg_m: 0,
    perimetro_total_mm: 0,
    perimetro_ext_mm: 0,
    perimetro_int_mm: 0
  },
  "1015B": {
    ref: "1015B",
    nombre: "Rect. 20×10×1,3 mecanizado",
    grupo_color: "perimetro",
    longitudes_barra: [4.5, 6.5],
    precio_m: { blanco: 4.36, textura: 4.62, color: 4.69, anodizado: 4.58, nature: 5.12 },
    peso_kg_m: 0.192,
    perimetro_total_mm: 11,
    perimetro_ext_mm: 10,
    perimetro_int_mm: 1
  },
  "7497": {
    ref: "7497",
    nombre: "Frontal Doha 100×55",
    grupo_color: "perimetro",
    longitudes_barra: [4.0, 6.5],
    precio_m: { blanco: 22.06, textura: 23.71, color: 24.12, anodizado: 23.32, nature: 26.58 },
    peso_kg_m: 1.543,
    perimetro_total_mm: 68.5,
    perimetro_ext_mm: 36.2,
    perimetro_int_mm: 32.3
  },
  "6323": {
    ref: "6323",
    nombre: "Pilar 125×125",
    grupo_color: "perimetro",
    longitudes_barra: [4.0, 6.5],
    precio_m: { blanco: 53.87, textura: 56.63, color: 57.32, anodizado: 54.61, nature: 59.05 },
    peso_kg_m: 3.959,
    perimetro_total_mm: 115,
    perimetro_ext_mm: 49.3,
    perimetro_int_mm: 65.7
  },
  "6863": {
    ref: "6863",
    nombre: "Perfil LED cornisa",
    grupo_color: "perimetro",
    longitudes_barra: [4.0, 6.5],
    precio_m: { blanco: 2.16, textura: 2.4, color: 2.46, anodizado: 2.91, nature: 3.81 },
    peso_kg_m: 0.139,
    perimetro_total_mm: 10,
    perimetro_ext_mm: 10,
    perimetro_int_mm: 0
  }
};

// ============================================================================
// PRECIOS DE ACCESORIOS
// ============================================================================
export const precio_accesorios = {
  "PB0038": { ref: "PB0038", nombre: "Tapa frontal motor IZQ", grupo_color: "estructura", precios: { sa: 8.62, blanco: 8.62, color: 10.83, textura: 10.83 } },
  "PB0039": { ref: "PB0039", nombre: "Tapa frontal motor DCH", grupo_color: "estructura", precios: { sa: 8.62, blanco: 8.62, color: 10.83, textura: 10.83 } },
  "PB0033": { ref: "PB0033", nombre: "Tapa lama izquierda", grupo_color: "lamas", precios: { sa: 4.05, blanco: 6.26, color: 6.26, textura: 6.26 } },
  "PB0032": { ref: "PB0032", nombre: "Tapa lama derecha", grupo_color: "lamas", precios: { sa: 4.05, blanco: 6.26, color: 6.26, textura: 6.26 } },
  "PB0035": { ref: "PB0035", nombre: "Tapa lama motor IZQDO", grupo_color: "lamas", precios: { sa: 3.67, blanco: 5.12, color: 5.12, textura: 5.12 } },
  "PB0034": { ref: "PB0034", nombre: "Tapa lama motor DCHO", grupo_color: "lamas", precios: { sa: 3.67, blanco: 5.12, color: 5.12, textura: 5.12 } },
  "PB0036": { ref: "PB0036", nombre: "Tapa final lama motor DCH", grupo_color: "lamas", precios: { sa: 3.67, blanco: 5.12, color: 5.12, textura: 5.12 } },
  "PB0037": { ref: "PB0037", nombre: "Tapa final lama motor IZQ", grupo_color: "lamas", precios: { sa: 3.67, blanco: 5.12, color: 5.12, textura: 5.12 } },
  "PB0005": { ref: "PB0005", nombre: "Tapa canalón", grupo_color: "estructura", precios: { sa: 4.03, blanco: 5.05, color: 5.05, textura: 5.05 } },
  "PB0044": { ref: "PB0044", nombre: "Tapa superior pilar", grupo_color: "estructura", precios: { sa: 22.87, blanco: 24.91, color: 24.91, textura: 24.91 } },
  "PB0015": { ref: "PB0015", nombre: "Tapa inferior anclaje pilar", grupo_color: "estructura", precios: { sa: 25.93, blanco: 31.03, color: 31.03, textura: 31.03 } },
  "PB0042": { ref: "PB0042", nombre: "Tapa frontal final IZQ", grupo_color: "estructura", precios: { sa: 7.96, blanco: 10.0, color: 10.0, textura: 10.0 } },
  "PB0043": { ref: "PB0043", nombre: "Tapa frontal final DCH", grupo_color: "estructura", precios: { sa: 7.96, blanco: 10.0, color: 10.0, textura: 10.0 } },
  "PB0041": { ref: "PB0041", nombre: "Placa soporte motor IZQ", grupo_color: "estructura", precios: { sa: 5.2, blanco: 6.39, color: 6.39, textura: 6.39 } },
  "PB0040": { ref: "PB0040", nombre: "Placa soporte motor DCH", grupo_color: "estructura", precios: { sa: 5.2, blanco: 6.22, color: 6.22, textura: 6.22 } },
  "PB0009": { ref: "PB0009", nombre: "Tapa compensadora", grupo_color: "lamas", precios: { sa: 6.41, blanco: 9.47, color: 9.47, textura: 9.47 } },
  "PB0030": { ref: "PB0030", nombre: "Kit tornillería lama", grupo_color: "lamas", precios: { sa: 9.61 } },
  "PB0031": { ref: "PB0031", nombre: "Kit tornillería pérgola", grupo_color: "estructura", precios: { sa: 52.19 } },
  "PB4505": { ref: "PB4505", nombre: "Adaptador motor", grupo_color: "neutro", precios: { sa: 3.27 } },
  "MO4004": { ref: "MO4004", nombre: "Motor 40Nm", grupo_color: "neutro", precios: { sa: 246.29 } },
  "TM A5369": { ref: "TM A5369", nombre: "Emisor giro plus warmgrey", grupo_color: "neutro", precios: { sa: 59.35 } },
  "PE 5254": { ref: "PE 5254", nombre: "Tira LED recta 2m", grupo_color: "neutro", precios: { sa: 4.95 } },
  "TA2010": { ref: "TA2010", nombre: "Tapón 20×10", grupo_color: "neutro", precios: { sa: 0.04 } },
  "PB0050": { ref: "PB0050", nombre: "Soporte pared larguero simple", grupo_color: "estructura", precios: { sa: 23.44, blanco: 27.01, color: 27.01, textura: 27.01 } },
  "PB0051": { ref: "PB0051", nombre: "Soporte pared larguero doble", grupo_color: "estructura", precios: { sa: 26.71, blanco: 30.79, color: 30.79, textura: 30.79 } },
  "PB0052": { ref: "PB0052", nombre: "Tapa pilar / larguero doble", grupo_color: "estructura", precios: { sa: 24.53, blanco: 28.27, color: 28.27, textura: 28.27 } },
  "PB0053": { ref: "PB0053", nombre: "Tapa larguero doble", grupo_color: "estructura", precios: { sa: 7.38, blanco: 11.49, color: 11.49, textura: 11.49 } },
  "PB HOBLO": { ref: "PB HOBLO", nombre: "Emisor Hoblo multifunción", grupo_color: "neutro", precios: { sa: 55.25 } },
  "TM 5200": { ref: "TM 5200", nombre: "Sensor lluvia", grupo_color: "neutro", precios: { sa: 191.0 } },
  "TM 5201": { ref: "TM 5201", nombre: "Sensor viento", grupo_color: "neutro", precios: { sa: 70.35 } },
  "KI CIPLS": { ref: "KI CIPLS", nombre: "Central LED silicone", grupo_color: "neutro", precios: { sa: 327.96 } },
  "KI CIFL": { ref: "KI CIFL", nombre: "Central LEDs 100 W", grupo_color: "neutro", precios: { sa: 275.94 } },
  "KI FL4W": { ref: "KI FL4W", nombre: "Foco 4 W", grupo_color: "neutro", precios: { sa: 47.89 } },
  "PB0060": { ref: "PB0060", nombre: "Kit tornillería lama FV", grupo_color: "lamas", precios: { sa: 13.43 } },
  "GO 5248": { ref: "GO 5248", nombre: "Goma ext. marco clip", grupo_color: "neutro", precios: { sa: 0.26 } },
  "TM A5367": { ref: "TM A5367", nombre: "Emisor giro monocanal", grupo_color: "neutro", precios: { sa: 0 } }
};

// ============================================================================
// TABLA DE LAMAS SEGÚN SALIDA
// ============================================================================
export const LAMAS_TABLE = [
  { n: 5,  min: 0.896, max: 1.089 },
  { n: 6,  min: 1.059, max: 1.252 },
  { n: 7,  min: 1.222, max: 1.415 },
  { n: 8,  min: 1.385, max: 1.578 },
  { n: 9,  min: 1.548, max: 1.741 },
  { n: 10, min: 1.711, max: 1.904 },
  { n: 11, min: 1.874, max: 2.067 },
  { n: 12, min: 2.037, max: 2.230 },
  { n: 13, min: 2.200, max: 2.393 },
  { n: 14, min: 2.363, max: 2.556 },
  { n: 15, min: 2.526, max: 2.719 },
  { n: 16, min: 2.689, max: 2.882 },
  { n: 17, min: 2.852, max: 3.045 },
  { n: 18, min: 3.015, max: 3.208 },
  { n: 19, min: 3.178, max: 3.371 },
  { n: 20, min: 3.341, max: 3.534 },
  { n: 21, min: 3.504, max: 3.697 },
  { n: 22, min: 3.667, max: 3.860 },
  { n: 23, min: 3.830, max: 4.023 },
  { n: 24, min: 3.993, max: 4.186 },
  { n: 25, min: 4.156, max: 4.349 },
  { n: 26, min: 4.319, max: 4.512 },
  { n: 27, min: 4.482, max: 4.675 },
  { n: 28, min: 4.645, max: 4.838 },
  { n: 29, min: 4.808, max: 5.001 },
  { n: 30, min: 4.971, max: 5.164 },
  { n: 31, min: 5.134, max: 5.327 },
  { n: 32, min: 5.297, max: 5.490 },
  { n: 33, min: 5.460, max: 5.653 },
  { n: 34, min: 5.623, max: 5.816 },
  { n: 35, min: 5.786, max: 6.000 }
];

// ============================================================================
// CALIBRE DEL PILAR
// ============================================================================
export const CALIBRE_PILAR_IA = "125 × 125 mm";

// ============================================================================
// TEXTOS DE AVISOS
// ============================================================================
export const AVISO_REFUERZO_TEXTO_PARED = 
  "⚠️ Se recomienda añadir pilares de refuerzo en el lateral apoyado en pared para mayor estabilidad.";

export const AVISO_REFUERZO_TEXTO_ENTRE = 
  "⚠️ Se recomienda añadir pilares de refuerzo en los laterales apoyados en pared para mayor estabilidad.";

// ============================================================================
// DESCRIPCIONES DE TIPOS DE MONTAJE
// ============================================================================
export const DESCRIPCIONES_MONT = {
  "pilares": "Pérgola exenta (4 pilares)",
  "pared-ancho": "Pérgola adosada a pared (frontal o trasera)",
  "pared-largo": "Pérgola adosada a pared (lateral)",
  "entre-paredes": "Pérgola entre paredes"
};

export const DESCRIPCIONES_MONT_DETALLADAS = {
  "pilares": "Pérgola completamente exenta con pilares en las 4 esquinas.",
  "pared-ancho": "Pérgola adosada a pared por el lado frontal o trasero (el lado más corto).",
  "pared-largo": "Pérgola adosada a pared por uno de los laterales (el lado más largo).",
  "entre-paredes": "Pérgola empotrada entre dos paredes paralelas."
};

// ============================================================================
// DESCRIPCIONES DE MATERIALES
// ============================================================================
export const DESCRIPCIONES = {
  "6391": "Larguero lateral Doha",
  "7616": "Perfil trasero Doha",
  "6436": "Travesaño lateral Doha doble",
  "6211": "Canalón Doha",
  "6211B": "Canalón Doha FV",
  "6214": "Soporte lama Doha",
  "6816": "Lama Doha",
  "6867": "Lama motor 230 mm Doha",
  "9125": "Lama motor 280 mm Doha",
  "6215": "Perfil portante Doha",
  "6212": "Perfil frontal Doha",
  "6218": "Lama compensadora Doha",
  "6217": "Soporte lama compensación",
  "5960": "Tapeta 22 mm clipada",
  "7985B": "Soporte tubo mecánica",
  "1015B": "Rect. 20×10×1,3 mecanizado",
  "7497": "Frontal Doha 100×55",
  "6323": "Pilar 125×125",
  "6863": "Perfil LED cornisa",
  "PB0038": "Tapa frontal motor IZQ",
  "PB0039": "Tapa frontal motor DCH",
  "PB0033": "Tapa lama izquierda",
  "PB0032": "Tapa lama derecha",
  "PB0035": "Tapa lama motor IZQDO",
  "PB0034": "Tapa lama motor DCHO",
  "PB0036": "Tapa final lama motor DCH",
  "PB0037": "Tapa final lama motor IZQ",
  "PB0005": "Tapa canalón",
  "PB0044": "Tapa superior pilar",
  "PB0015": "Tapa inferior anclaje pilar",
  "PB0042": "Tapa frontal final IZQ",
  "PB0043": "Tapa frontal final DCH",
  "PB0041": "Placa soporte motor IZQ",
  "PB0040": "Placa soporte motor DCH",
  "PB0009": "Tapa compensadora",
  "PB0030": "Kit tornillería lama",
  "PB0031": "Kit tornillería pérgola",
  "PB4505": "Adaptador motor",
  "MO4004": "Motor 40Nm",
  "TM A5369": "Emisor giro plus warmgrey",
  "PE 5254": "Tira LED recta 2m",
  "TA2010": "Tapón 20×10",
  "PB0050": "Soporte pared larguero simple",
  "PB0051": "Soporte pared larguero doble",
  "PB0052": "Tapa pilar / larguero doble",
  "PB0053": "Tapa larguero doble",
  "PB HOBLO": "Emisor Hoblo multifunción",
  "TM 5200": "Sensor lluvia",
  "TM 5201": "Sensor viento",
  "KI CIPLS": "Central LED silicone",
  "KI CIFL": "Central LEDs 100 W",
  "KI FL4W": "Foco 4 W",
  "PB0060": "Kit tornillería lama FV",
  "GO 5248": "Goma ext. marco clip",
  "TM A5367": "Emisor giro monocanal",
  "PB0012": "Embellecedor lateral izquierdo",
  "PB0013": "Embellecedor lateral derecho"
};

// ============================================================================
// MÁRGENES Y MERMAS (constantes para optimización de cortes)
// ============================================================================
export const MARGEN_PUNTA_MM = 50;
export const MERMA_CORTE_MM = 5;
