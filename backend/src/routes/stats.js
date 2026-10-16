const express = require('express');
const db = require('../lib/db');
const { inventario } = require('../lib/biomasa');
const { fechaLocal } = require('../lib/fechas');

const router = express.Router();

const sum = (items, campo) => items.reduce((total, item) => total + (Number(item[campo]) || 0), 0);
const promedio = valores => (valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null);
const redondear = n => (n === null ? null : Math.round(n * 10) / 10);

// Último seguimiento de cada dispersión (el más reciente manda)
function ultimoSeguimiento() {
  const porDispersion = {};
  for (const s of db.list('seguimientos')) {
    const actual = porDispersion[s.dispersionId];
    if (!actual || s.creadoEn > actual.creadoEn) porDispersion[s.dispersionId] = s;
  }
  return porDispersion;
}

function resumenDispersiones(dispersiones, seguimientos) {
  const revisadas = dispersiones.filter(d => seguimientos[d.id]);
  const pildorasRevisadas = sum(revisadas, 'cantidad');
  const germinadas = revisadas.reduce((t, d) => t + seguimientos[d.id].germinadas, 0);
  const vivas = revisadas.reduce((t, d) => t + (seguimientos[d.id].vivas ?? seguimientos[d.id].germinadas), 0);
  const alturas = revisadas.map(d => seguimientos[d.id].alturaPromedioCm).filter(a => typeof a === 'number');
  return {
    dispersiones: dispersiones.length,
    pildoras: sum(dispersiones, 'cantidad'),
    pildorasRevisadas,
    germinadas,
    vivas,
    // plántulas por cada 100 píldoras revisadas
    tasaGerminacion: pildorasRevisadas ? redondear((germinadas / pildorasRevisadas) * 100) : null,
    alturaPromedioCm: redondear(promedio(alturas)),
  };
}

function agrupar(items, clave) {
  const grupos = {};
  for (const item of items) {
    const k = item[clave] || 'sin dato';
    (grupos[k] = grupos[k] || []).push(item);
  }
  return grupos;
}

router.get('/', (req, res) => {
  const dispersiones = db.list('dispersiones');
  const seguimientos = ultimoSeguimiento();
  const lotes = db.list('lotes');
  const especies = Object.fromEntries(db.list('especies').map(e => [e.id, e.nombreComun]));

  const porEspecie = Object.entries(agrupar(dispersiones, 'especieId')).map(([id, items]) => ({
    especieId: id,
    especie: especies[id] || id,
    ...resumenDispersiones(items, seguimientos),
  }));

  const porZona = Object.entries(agrupar(dispersiones, 'zona')).map(([zona, items]) => ({
    zona,
    ...resumenDispersiones(items, seguimientos),
  }));

  const areas = Object.fromEntries(db.list('areasReforestacion').map(a => [a.id, a]));
  const porArea = Object.entries(agrupar(dispersiones.filter(d => d.areaId), 'areaId')).map(([id, items]) => ({
    areaId: id,
    area: areas[id] ? areas[id].nombre : id,
    estado: areas[id] ? areas[id].estado : null,
    ...resumenDispersiones(items, seguimientos),
  }));

  const jornadasRef = db.list('jornadasReforestacion');
  const realizadas = jornadasRef.filter(j => j.estado === 'realizada');
  const reforestacion = {
    areas: db.list('areasReforestacion').length,
    hectareas: redondear(sum(db.list('areasReforestacion'), 'hectareas')),
    jornadasRealizadas: realizadas.length,
    jornadasProximas: jornadasRef.filter(j => j.estado === 'programada' && j.fecha >= fechaLocal()).length,
    participantes: new Set(realizadas.flatMap(j => j.asistentes || [])).size,
  };

  // Ensayos: promedio por tratamiento y prueba
  const ensayos = [];
  for (const [tratamiento, items] of Object.entries(agrupar(db.list('ensayos'), 'tratamiento'))) {
    for (const [prueba, mediciones] of Object.entries(agrupar(items, 'prueba'))) {
      ensayos.push({
        tratamiento,
        prueba,
        unidad: mediciones[0].unidad,
        n: mediciones.length,
        promedio: redondear(promedio(mediciones.map(m => m.valor))),
      });
    }
  }

  res.json({
    success: true,
    stats: {
      kgPodaRecibida: redondear(sum(db.list('entregasPoda'), 'kg')),
      entregasPoda: db.list('entregasPoda').length,
      lotes: lotes.length,
      pildorasProducidas: sum(lotes, 'cantidad'),
      ...resumenDispersiones(dispersiones, seguimientos),
      voluntarios: db.list('usuarios').length,
      biomasa: inventario(),
      solicitudesPendientes: db.list('solicitudes').filter(s => s.estado === 'pendiente' || s.estado === 'asignada').length,
      jornadasProximas: db.list('jornadas').filter(j => j.estado === 'programada' && j.fecha >= fechaLocal()).length,
      porEspecie,
      porZona,
      porArea,
      reforestacion,
      ensayos,
    },
  });
});

module.exports = router;
