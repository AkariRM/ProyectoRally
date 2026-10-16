const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportesController');

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/stats', ctrl.getStats);
router.get('/:id', ctrl.getOne);

module.exports = router;
