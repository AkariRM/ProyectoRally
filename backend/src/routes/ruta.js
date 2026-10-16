const express = require('express');
const db = require('../lib/db');
const { fechaLocal } = require('../lib/fechas');

// GET /api/ruta?lat=&lng=&puntoId=
// Ruta sugerida de recolección: solicitudes pendientes o asignadas al usuario y zonas
// con jornada de poda hoy, ordenadas por "vecino más cercano" desde la ubicación actual.
// Si se indica puntoId, el punto de acopio se agrega al final para descargar.

const router = express.Router();

function distanciaKm(a, b) {
  const R = 6371;
  const rad = x => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

router.get('/', (req, res) => {
  const inicio = { lat: Number(req.query.lat), lng: Number(req.query.lng) };
  if (!Number.isFinite(inicio.lat) || !Number.isFinite(inicio.lng)) {
    return res.status(400).json({ error: 'indica lat y lng de tu ubicación' });
  }

  const hoy = fechaLocal();
  const paradas = [
    ...db
      .list('solicitudes')
      .filter(s => s.estado === 'pendiente' || (s.estado === 'asignada' && s.recolectorId === req.usuario.id))
      .map(s => ({
        tipo: 'solicitud', id: s.id, nombre: s.direccion, lat: s.lat, lng: s.lng,
        detalle: `${s.kgEstimados ?? '?'} kg · ${s.estado}`,
      })),
    ...db
      .list('jornadas')
      .filter(j => j.estado === 'programada' && j.fecha === hoy)
      .map(j => ({ j, z: db.get('zonasPoda', j.zonaId) }))
      .filter(({ z }) => z)
      .map(({ j, z }) => ({
        tipo: 'jornada', id: j.id, nombre: z.nombre, lat: z.lat, lng: z.lng,
        detalle: `Poda hoy ${j.horaInicio ?? ''}${j.horaFin ? `–${j.horaFin}` : ''}`,
      })),
  ];

  // Vecino más cercano
  const orden = [];
  let actual = inicio;
  const pendientes = [...paradas];
  while (pendientes.length) {
    let mejor = 0;
    for (let i = 1; i < pendientes.length; i++) {
      if (distanciaKm(actual, pendientes[i]) < distanciaKm(actual, pendientes[mejor])) mejor = i;
    }
    const [siguiente] = pendientes.splice(mejor, 1);
    orden.push({ ...siguiente, km: Math.round(distanciaKm(actual, siguiente) * 100) / 100 });
    actual = siguiente;
  }

  const punto = req.query.puntoId && db.get('puntosAcopio', req.query.puntoId);
  if (punto && typeof punto.lat === 'number') {
    orden.push({
      tipo: 'acopio', id: punto.id, nombre: punto.nombre, lat: punto.lat, lng: punto.lng,
      detalle: 'Descargar la poda', km: Math.round(distanciaKm(actual, punto) * 100) / 100,
    });
  }

  const totalKm = Math.round(orden.reduce((t, p) => t + p.km, 0) * 100) / 100;
  // Google Maps admite hasta 9 paradas intermedias en un enlace
  let googleMapsUrl = null;
  if (orden.length) {
    const coord = p => `${p.lat},${p.lng}`;
    const destino = orden[Math.min(orden.length, 10) - 1];
    const intermedias = orden.slice(0, Math.min(orden.length, 10) - 1).map(coord).join('|');
    googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${coord(inicio)}&destination=${coord(destino)}` +
      `${intermedias ? `&waypoints=${encodeURIComponent(intermedias)}` : ''}&travelmode=driving`;
  }

  res.json({ success: true, data: { paradas: orden, totalKm, googleMapsUrl } });
});

module.exports = router;
