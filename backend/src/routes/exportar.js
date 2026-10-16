const express = require('express');
const db = require('../lib/db');
const { requiereRol } = require('../lib/auth');

// GET /api/exportar/:recurso.:formato   (formato: csv | geojson)
// CSV para Excel / estadística; GeoJSON para QGIS. Solo admin, municipio y brigadista
// (incluye datos de contacto de solicitudes). Acepta ?token= para descargar desde el navegador.

const RECURSOS = {
  'zonas-poda': 'zonasPoda',
  'puntos-acopio': 'puntosAcopio',
  'areas-reforestacion': 'areasReforestacion',
  dispersiones: 'dispersiones',
  solicitudes: 'solicitudes',
  'entregas-poda': 'entregasPoda',
  'procesos-biomasa': 'procesosBiomasa',
  lotes: 'lotes',
  ensayos: 'ensayos',
  seguimientos: 'seguimientos',
  'jornadas-poda': 'jornadas',
  'jornadas-reforestacion': 'jornadasReforestacion',
};
const CON_GEOMETRIA = ['zonas-poda', 'puntos-acopio', 'areas-reforestacion', 'dispersiones', 'solicitudes'];

// Círculo como polígono (32 vértices) para que QGIS lo dibuje sin hacer buffer
function circulo(lat, lng, radioM, n = 32) {
  const R = 6378137;
  const coords = [];
  for (let i = 0; i <= n; i++) {
    const ang = (2 * Math.PI * i) / n;
    const dLat = (radioM * Math.cos(ang)) / R;
    const dLng = (radioM * Math.sin(ang)) / (R * Math.cos((lat * Math.PI) / 180));
    coords.push([lng + (dLng * 180) / Math.PI, lat + (dLat * 180) / Math.PI]);
  }
  return coords;
}

function geometria(item) {
  if (Array.isArray(item.poligono) && item.poligono.length >= 3) {
    const anillo = item.poligono.map(([lat, lng]) => [lng, lat]);
    anillo.push(anillo[0]);
    return { type: 'Polygon', coordinates: [anillo] };
  }
  if (typeof item.lat !== 'number' || typeof item.lng !== 'number') return null;
  if (item.radioM) return { type: 'Polygon', coordinates: [circulo(item.lat, item.lng, item.radioM)] };
  return { type: 'Point', coordinates: [item.lng, item.lat] };
}

// Valores simples para CSV y propiedades de GeoJSON
const plano = v => (Array.isArray(v) ? v.join('; ') : v !== null && typeof v === 'object' ? JSON.stringify(v) : v);

function aCsv(items) {
  const columnas = [...new Set(items.flatMap(i => Object.keys(i)))].filter(c => c !== 'passwordHash');
  const celda = v => {
    const t = v === undefined || v === null ? '' : String(plano(v));
    return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const filas = items.map(i => columnas.map(c => celda(i[c])).join(','));
  return '﻿' + [columnas.join(','), ...filas].join('\r\n'); // BOM para que Excel lea los acentos
}

function aGeojson(items) {
  return {
    type: 'FeatureCollection',
    features: items
      .map(i => {
        const geometry = geometria(i);
        if (!geometry) return null;
        const { poligono, ...resto } = i;
        return { type: 'Feature', geometry, properties: Object.fromEntries(Object.entries(resto).map(([k, v]) => [k, plano(v)])) };
      })
      .filter(Boolean),
  };
}

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: Object.keys(RECURSOS).map(r => ({ recurso: r, formatos: CON_GEOMETRIA.includes(r) ? ['csv', 'geojson'] : ['csv'] })),
  });
});

router.get('/:archivo', requiereRol('municipio', 'brigadista'), (req, res) => {
  const [recurso, formato] = req.params.archivo.split('.');
  const coleccion = RECURSOS[recurso];
  if (!coleccion) return res.status(404).json({ error: `recurso desconocido; usa: ${Object.keys(RECURSOS).join(', ')}` });
  const items = db.list(coleccion);
  const nombre = `${recurso}-${new Date().toISOString().slice(0, 10)}`;

  if (formato === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}.csv"`);
    return res.send(aCsv(items));
  }
  if (formato === 'geojson') {
    if (!CON_GEOMETRIA.includes(recurso)) return res.status(400).json({ error: `${recurso} no tiene ubicación; usa .csv` });
    res.setHeader('Content-Type', 'application/geo+json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}.geojson"`);
    return res.send(JSON.stringify(aGeojson(items)));
  }
  res.status(400).json({ error: 'formato debe ser csv o geojson' });
});

module.exports = router;
