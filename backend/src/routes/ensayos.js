const express = require('express');
const db = require('../lib/db');
const { crudRouter } = require('../lib/crud');

// Mediciones de laboratorio capturadas a mano (sin sensores) para comparar mezclas.
// Tratamientos y pruebas son catálogos editables (/api/tratamientos, /api/pruebas).

const router = express.Router();

// Formato compacto que usaba la app: { tratamientos: [ids], pruebas: { id: unidad } }
router.get('/catalogo', (req, res) => {
  res.json({
    success: true,
    data: {
      tratamientos: db.list('tratamientos').map(t => t.id),
      pruebas: Object.fromEntries(db.list('pruebas').map(p => [p.id, p.unidad])),
    },
  });
});

router.use(
  crudRouter(
    'ensayos',
    {
      tratamiento: { type: 'string', required: true, ref: 'tratamientos' },
      prueba: { type: 'string', required: true, ref: 'pruebas' },
      valor: { type: 'number', required: true },
      unidad: { type: 'string' },
      repeticion: { type: 'number', min: 1 },
      loteId: { type: 'string', ref: 'lotes' },
      usuarioId: { type: 'string', ref: 'usuarios' },
      notas: { type: 'string' },
    },
    {
      beforeCreate: data => ({ ...data, unidad: db.get('pruebas', data.prueba).unidad }),
    },
  ),
);

module.exports = router;
