const express = require('express');
const db = require('../lib/db');
const { crudRouter, validate } = require('../lib/crud');
const { requiereUsuario } = require('../lib/auth');

// Solicitudes de recolección: alguien tiene poda de ficus y pide que pasen por ella.
// Flujo de estado: pendiente → asignada → recolectada  (o cancelada)
// Al marcarla como recolectada se crea automáticamente la entrega de poda.

const ESTADOS = ['pendiente', 'asignada', 'recolectada', 'cancelada'];
const TRANSICIONES = {
  pendiente: ['asignada', 'cancelada'],
  asignada: ['pendiente', 'recolectada', 'cancelada'],
  recolectada: [],
  cancelada: [],
};

const router = express.Router();

router.put('/:id/estado', requiereUsuario, (req, res) => {
  const solicitud = db.get('solicitudes', req.params.id);
  if (!solicitud) return res.status(404).json({ error: 'No encontrado' });

  const { errores, data } = validate(
    {
      estado: { type: 'enum', required: true, values: ESTADOS },
      puntoId: { type: 'string', ref: 'puntosAcopio' },
      kgReales: { type: 'number', min: 0.1 },
    },
    req.body,
  );
  data.recolectorId = req.usuario.id;
  if (data.estado === 'cancelada' && req.usuario.rol !== 'admin' && solicitud.usuarioId !== req.usuario.id) {
    errores.push('solo quien hizo la solicitud o un administrador puede cancelarla');
  }
  if (!TRANSICIONES[solicitud.estado].includes(data.estado)) {
    errores.push(`no se puede pasar de ${solicitud.estado} a ${data.estado}`);
  }
  if (data.estado === 'recolectada' && (!data.kgReales || !data.puntoId)) {
    errores.push('para marcar como recolectada indica kgReales y puntoId');
  }
  if (errores.length) return res.status(400).json({ error: errores.join('; '), errores });

  const cambios = { estado: data.estado, [`${data.estado}En`]: new Date().toISOString() };
  if (data.estado === 'asignada') cambios.recolectorId = data.recolectorId;
  if (data.estado === 'pendiente') cambios.recolectorId = null;
  if (data.estado === 'recolectada') {
    const entrega = db.insert('entregasPoda', {
      puntoId: data.puntoId,
      kg: data.kgReales,
      usuarioId: data.recolectorId || solicitud.recolectorId || undefined,
      solicitudId: solicitud.id,
      notas: `Recolección en ${solicitud.direccion}`,
    });
    Object.assign(cambios, { kgReales: data.kgReales, puntoId: data.puntoId, entregaId: entrega.id });
  }

  res.json({ success: true, data: db.update('solicitudes', solicitud.id, cambios) });
});

router.use(
  crudRouter(
    'solicitudes',
    {
      nombre: { type: 'string', required: true }, // quien entrega
      contacto: { type: 'string' }, // teléfono o correo
      direccion: { type: 'string', required: true },
      municipio: { type: 'enum', values: ['Jiquilpan', 'Sahuayo', 'Otro'] },
      lat: { type: 'number', required: true, min: -90, max: 90 },
      lng: { type: 'number', required: true, min: -180, max: 180 },
      kgEstimados: { type: 'number', min: 0.1 },
      estado: { type: 'enum', values: ESTADOS },
      usuarioId: { type: 'string', ref: 'usuarios' },
      notas: { type: 'string' },
    },
    {
      beforeCreate: data => ({ ...data, estado: 'pendiente' }),
    },
  ),
);

module.exports = router;
