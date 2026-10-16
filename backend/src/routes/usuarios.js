const express = require('express');
const db = require('../lib/db');
const { validate } = require('../lib/crud');

const router = express.Router();

const schema = {
  nombre: { type: 'string', required: true },
  email: { type: 'string', required: true },
  carrera: { type: 'enum', values: ['Sistemas', 'Bioquímica', 'Arquitectura', 'Voluntario'] },
};

// Registro sencillo sin contraseña (prototipo). Falta autenticación real (JWT).
router.post('/registro', (req, res) => {
  const { errores, data } = validate(schema, req.body);
  if (errores.length) return res.status(400).json({ error: errores.join('; '), errores });
  const email = data.email.toLowerCase();
  if (db.list('usuarios').some(u => u.email === email)) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }
  res.status(201).json({ success: true, data: db.insert('usuarios', { ...data, email }) });
});

router.post('/login', (req, res) => {
  const email = String(req.body.email || '').toLowerCase();
  const usuario = db.list('usuarios').find(u => u.email === email);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ success: true, data: usuario });
});

router.get('/:id', (req, res) => {
  const usuario = db.get('usuarios', req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ success: true, data: usuario });
});

module.exports = router;
