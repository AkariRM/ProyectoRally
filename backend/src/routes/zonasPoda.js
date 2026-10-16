const express = require('express');
const db = require('../lib/db');
const { crudRouter } = require('../lib/crud');
const { fechaLocal, validarHora } = require('../lib/fechas');
const { requiereRol } = require('../lib/auth');

// Zonas donde se poda Ficus benjamina (calles, plazas, parques).
// diasSemana: 0 = domingo … 6 = sábado. A partir del horario se generan jornadas.

const router = express.Router();

// POST /api/zonas-poda/:id/generar-jornadas  { semanas: 4 }
// Crea las jornadas de las próximas semanas según los días de poda de la zona.
router.post('/:id/generar-jornadas', requiereRol('municipio'), (req, res) => {
  const zona = db.get('zonasPoda', req.params.id);
  if (!zona) return res.status(404).json({ error: 'No encontrado' });
  if (!zona.diasSemana || !zona.diasSemana.length) {
    return res.status(400).json({ error: 'la zona no tiene días de poda configurados' });
  }
  const semanas = Math.min(Math.max(Number(req.body.semanas) || 4, 1), 12);
  const existentes = new Set(db.list('jornadas').filter(j => j.zonaId === zona.id).map(j => j.fecha));

  const creadas = [];
  const dia = new Date();
  for (let i = 0; i < semanas * 7; i++) {
    const fecha = fechaLocal(dia);
    if (zona.diasSemana.includes(dia.getDay()) && !existentes.has(fecha)) {
      creadas.push(
        db.insert('jornadas', {
          zonaId: zona.id,
          fecha,
          horaInicio: zona.horaInicio,
          horaFin: zona.horaFin,
          puntoDestinoId: zona.puntoDestinoId,
          estado: 'programada',
          voluntarios: [],
        }),
      );
    }
    dia.setDate(dia.getDate() + 1);
  }
  res.status(201).json({ success: true, data: creadas });
});

router.use(
  crudRouter(
    'zonasPoda',
    {
      nombre: { type: 'string', required: true },
      municipio: { type: 'enum', values: ['Jiquilpan', 'Sahuayo', 'Otro'] },
      tipo: { type: 'enum', values: ['calle', 'plaza', 'parque', 'escuela', 'otro'] },
      lat: { type: 'number', required: true, min: -90, max: 90 },
      lng: { type: 'number', required: true, min: -180, max: 180 },
      radioM: { type: 'number', min: 10, max: 5000 },
      responsable: { type: 'string' }, // quién poda (ej. Servicios Públicos Municipales)
      puntoDestinoId: { type: 'string', ref: 'puntosAcopio' },
      diasSemana: { type: 'object' },
      horaInicio: { type: 'string' },
      horaFin: { type: 'string' },
      usuarioId: { type: 'string', ref: 'usuarios' },
      notas: { type: 'string' },
    },
    {
      validate: data => {
        const errores = [];
        if (data.diasSemana !== undefined) {
          const ok = Array.isArray(data.diasSemana) && data.diasSemana.every(d => Number.isInteger(d) && d >= 0 && d <= 6);
          if (!ok) errores.push('diasSemana debe ser una lista de números 0–6 (0 = domingo)');
        }
        errores.push(...validarHora('horaInicio', data.horaInicio), ...validarHora('horaFin', data.horaFin));
        return errores;
      },
      roles: ['municipio'],
      beforeCreate: data => ({ radioM: 150, diasSemana: [], ...data }),
      // Al borrar una zona se borran sus jornadas aún programadas (se conserva el historial)
      beforeDelete: zona => {
        for (const j of db.list('jornadas').filter(j => j.zonaId === zona.id && j.estado === 'programada')) {
          db.remove('jornadas', j.id);
        }
        return null;
      },
    },
  ),
);

module.exports = router;
