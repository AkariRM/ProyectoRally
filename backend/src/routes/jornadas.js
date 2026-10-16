const express = require('express');
const db = require('../lib/db');
const { crudRouter, validate } = require('../lib/crud');
const { fechaLocal, validarHora, validarFecha } = require('../lib/fechas');

// Jornadas de poda: un día y horario concretos en que se poda una zona.
// Los voluntarios se apuntan, recolectan la biomasa y la llevan al punto destino.
// Al marcar la jornada como recolectada se crea la entrega de poda en ese punto.

const ESTADOS = ['programada', 'recolectada', 'cancelada'];

const router = express.Router();

const conZona = j => ({ ...j, zona: db.get('zonasPoda', j.zonaId) });

// GET /api/jornadas/proximas → programadas de hoy en adelante, ordenadas, con su zona
router.get('/proximas', (req, res) => {
  const hoy = fechaLocal();
  const proximas = db
    .list('jornadas')
    .filter(j => j.estado === 'programada' && j.fecha >= hoy)
    .sort((a, b) => `${a.fecha} ${a.horaInicio || ''}`.localeCompare(`${b.fecha} ${b.horaInicio || ''}`))
    .map(conZona);
  res.json({ success: true, data: proximas });
});

// POST /api/jornadas/:id/apuntarme { usuarioId, quitar? }
router.post('/:id/apuntarme', (req, res) => {
  const jornada = db.get('jornadas', req.params.id);
  if (!jornada) return res.status(404).json({ error: 'No encontrado' });
  const { usuarioId, quitar } = req.body;
  if (!usuarioId || !db.get('usuarios', usuarioId)) return res.status(400).json({ error: 'usuarioId inválido' });
  const voluntarios = new Set(jornada.voluntarios || []);
  if (quitar) voluntarios.delete(usuarioId);
  else voluntarios.add(usuarioId);
  res.json({ success: true, data: db.update('jornadas', jornada.id, { voluntarios: [...voluntarios] }) });
});

// PUT /api/jornadas/:id/estado { estado, kgRecolectados, puntoDestinoId, usuarioId }
router.put('/:id/estado', (req, res) => {
  const jornada = db.get('jornadas', req.params.id);
  if (!jornada) return res.status(404).json({ error: 'No encontrado' });
  const { errores, data } = validate(
    {
      estado: { type: 'enum', required: true, values: ['recolectada', 'cancelada'] },
      kgRecolectados: { type: 'number', min: 0.1 },
      puntoDestinoId: { type: 'string', ref: 'puntosAcopio' },
      usuarioId: { type: 'string', ref: 'usuarios' },
    },
    req.body,
  );
  if (jornada.estado !== 'programada') errores.push(`la jornada ya está ${jornada.estado}`);
  const puntoId = data.puntoDestinoId || jornada.puntoDestinoId;
  if (data.estado === 'recolectada' && (!data.kgRecolectados || !puntoId)) {
    errores.push('para marcar como recolectada indica kgRecolectados y puntoDestinoId');
  }
  if (errores.length) return res.status(400).json({ error: errores.join('; '), errores });

  const cambios = { estado: data.estado, [`${data.estado}En`]: new Date().toISOString() };
  if (data.estado === 'recolectada') {
    const zona = db.get('zonasPoda', jornada.zonaId);
    const entrega = db.insert('entregasPoda', {
      puntoId,
      kg: data.kgRecolectados,
      usuarioId: data.usuarioId,
      jornadaId: jornada.id,
      notas: `Jornada de poda ${zona ? zona.nombre : ''} ${jornada.fecha}`.trim(),
    });
    Object.assign(cambios, { kgRecolectados: data.kgRecolectados, puntoDestinoId: puntoId, entregaId: entrega.id });
  }
  res.json({ success: true, data: db.update('jornadas', jornada.id, cambios) });
});

router.use(
  crudRouter(
    'jornadas',
    {
      zonaId: { type: 'string', required: true, ref: 'zonasPoda' },
      fecha: { type: 'string', required: true },
      horaInicio: { type: 'string' },
      horaFin: { type: 'string' },
      puntoDestinoId: { type: 'string', ref: 'puntosAcopio' },
      estado: { type: 'enum', values: ESTADOS },
      usuarioId: { type: 'string', ref: 'usuarios' },
      notas: { type: 'string' },
    },
    {
      validate: data => [
        ...validarFecha('fecha', data.fecha),
        ...validarHora('horaInicio', data.horaInicio),
        ...validarHora('horaFin', data.horaFin),
      ],
      // Hereda horario y destino de la zona si no se indican
      beforeCreate: data => {
        const zona = db.get('zonasPoda', data.zonaId);
        return {
          horaInicio: zona.horaInicio,
          horaFin: zona.horaFin,
          puntoDestinoId: zona.puntoDestinoId,
          ...data,
          estado: 'programada',
          voluntarios: [],
        };
      },
    },
  ),
);

module.exports = router;
