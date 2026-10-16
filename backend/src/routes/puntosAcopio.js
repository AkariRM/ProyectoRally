const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/puntosAcopioController');

// GET  /api/puntos-acopio       → listar todos
// POST /api/puntos-acopio       → crear nuevo punto
// GET  /api/puntos-acopio/:id   → obtener uno
// PUT  /api/puntos-acopio/:id   → actualizar
// DELETE /api/puntos-acopio/:id → eliminar

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
