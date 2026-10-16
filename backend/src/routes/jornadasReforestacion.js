const express = require('express');
const db = require('../lib/db');
const { crudRouter, validate } = require('../lib/crud');
const { fechaLocal, validarHora, validarFecha } = require('../lib/fechas');
const { requiereRol, publico } = require('../lib/auth');

// Jornadas de reforestación masiva: se convoca a voluntarios y brigadas a sembrar
// píldoras en un área quemada. Al cerrarla se registra la asistencia y la dispersión.

const router = express.Router();

const conArea = j => ({ ...j, area: db.get('areasReforestacion', j.areaId) });

// GET /api/jornadas-reforestacion/proximas
router.get('/proximas', (req, res) => {
  const hoy = fechaLocal();
  const proximas = db
    .list('jornadasReforestacion')
    .filter(j => j.estado === 'programada' && j.fecha >= hoy)
    .sort((a, b) => `${a.fecha} ${a.horaInicio || ''}`.localeCompare(`${b.fecha} ${b.horaInicio || ''}`))
    .map(conArea);
  res.json({ success: true, data: proximas });
});

// GET /api/jornadas-reforestacion/:id/inscritos  (admin o brigadista: correos para pasar lista)
router.get('/:id/inscritos', requiereRol('brigadista'), (req, res) => {
  const jornada = db.get('jornadasReforestacion', req.params.id);
  if (!jornada) return res.status(404).json({ error: 'No encontrado' });
  const usuarios = jornada.inscritos.map(id => publico(db.get('usuarios', id))).filter(Boolean);
  res.json({ success: true, data: usuarios.map(u => ({ id: u.id, email: u.email })) });
});

// POST /api/jornadas-reforestacion/:id/inscribirme { quitar? }
router.post('/:id/inscribirme', (req, res) => {
  const jornada = db.get('jornadasReforestacion', req.params.id);
  if (!jornada) return res.status(404).json({ error: 'No encontrado' });
  if (jornada.estado !== 'programada') return res.status(400).json({ error: `la jornada ya está ${jornada.estado}` });
  const inscritos = new Set(jornada.inscritos);
  if (req.body.quitar) inscritos.delete(req.usuario.id);
  else {
    if (jornada.cupo && inscritos.size >= jornada.cupo && !inscritos.has(req.usuario.id)) {
      return res.status(400).json({ error: 'La jornada ya está llena' });
    }
    inscritos.add(req.usuario.id);
  }
  res.json({ success: true, data: db.update('jornadasReforestacion', jornada.id, { inscritos: [...inscritos] }) });
});

// PUT /api/jornadas-reforestacion/:id/cerrar
//   { estado: 'realizada', asistentes: [ids], pildorasDispersadas, loteId?, especieId? }  o  { estado: 'cancelada' }
router.put('/:id/cerrar', requiereRol('brigadista'), (req, res) => {
  const jornada = db.get('jornadasReforestacion', req.params.id);
  if (!jornada) return res.status(404).json({ error: 'No encontrado' });
  const { errores, data } = validate(
    {
      estado: { type: 'enum', required: true, values: ['realizada', 'cancelada'] },
      asistentes: { type: 'object' },
      pildorasDispersadas: { type: 'number', min: 0 },
      loteId: { type: 'string', ref: 'lotes' },
      especieId: { type: 'string', ref: 'especies' },
    },
    req.body,
  );
  if (jornada.estado !== 'programada') errores.push(`la jornada ya está ${jornada.estado}`);
  const asistentes = data.asistentes ?? [];
  if (!Array.isArray(asistentes) || !asistentes.every(id => db.get('usuarios', id))) {
    errores.push('asistentes debe ser una lista de ids de usuarios');
  }
  if (data.estado === 'realizada' && data.pildorasDispersadas && !data.loteId && !data.especieId) {
    errores.push('indica loteId o especieId de las píldoras dispersadas');
  }
  if (errores.length) return res.status(400).json({ error: errores.join('; '), errores });

  const cambios = { estado: data.estado, cerradaPor: req.usuario.id, [`${data.estado}En`]: new Date().toISOString() };
  if (data.estado === 'realizada') {
    cambios.asistentes = asistentes;
    cambios.pildorasDispersadas = data.pildorasDispersadas || 0;
    // La siembra queda registrada como dispersión en el centro del área, para su seguimiento
    if (data.pildorasDispersadas) {
      const area = db.get('areasReforestacion', jornada.areaId);
      const lote = data.loteId && db.get('lotes', data.loteId);
      const dispersion = db.insert('dispersiones', {
        lat: area.lat,
        lng: area.lng,
        zona: area.nombre,
        municipio: area.municipio,
        areaId: area.id,
        jornadaReforestacionId: jornada.id,
        loteId: data.loteId,
        especieId: data.especieId || (lote && lote.especieId),
        cantidad: data.pildorasDispersadas,
        usuarioId: req.usuario.id,
        notas: `Jornada de reforestación ${jornada.fecha} (${asistentes.length} asistentes)`,
      });
      cambios.dispersionId = dispersion.id;
    }
    const area = db.get('areasReforestacion', jornada.areaId);
    if (area && (area.estado === 'quemada' || area.estado === 'degradada')) {
      db.update('areasReforestacion', area.id, { estado: 'en reforestación' });
    }
  }
  res.json({ success: true, data: db.update('jornadasReforestacion', jornada.id, cambios) });
});

router.use(
  crudRouter(
    'jornadasReforestacion',
    {
      titulo: { type: 'string', required: true },
      areaId: { type: 'string', required: true, ref: 'areasReforestacion' },
      fecha: { type: 'string', required: true },
      horaInicio: { type: 'string' },
      horaFin: { type: 'string' },
      puntoReunion: { type: 'string' },
      cupo: { type: 'number', min: 1 },
      pildorasMeta: { type: 'number', min: 1 },
      organiza: { type: 'string' }, // ej. Ayuntamiento, brigada comunitaria, ITJ
      usuarioId: { type: 'string', ref: 'usuarios' },
      descripcion: { type: 'string' },
    },
    {
      roles: ['brigadista'],
      validate: data => [
        ...validarFecha('fecha', data.fecha),
        ...validarHora('horaInicio', data.horaInicio),
        ...validarHora('horaFin', data.horaFin),
      ],
      beforeCreate: data => ({ ...data, estado: 'programada', inscritos: [], asistentes: [] }),
    },
  ),
);

module.exports = router;
