const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuariosController');

router.post('/registro', ctrl.register);
router.post('/login', ctrl.login);
router.get('/perfil/:id', ctrl.getProfile);

module.exports = router;
