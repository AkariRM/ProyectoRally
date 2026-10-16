const express = require('express');
const db = require('../lib/db');
const {
  hashPassword, verificarPassword, crearToken, publico, requiereUsuario, requiereAdmin,
} = require('../lib/auth');

const router = express.Router();

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarCredenciales(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const errores = [];
  if (!EMAIL.test(email)) errores.push('correo inválido');
  if (password.length < 6) errores.push('la clave debe tener al menos 6 caracteres');
  return { email, password, errores };
}

// POST /api/usuarios/registro { email, password } → { usuario, token }
router.post('/registro', (req, res) => {
  const { email, password, errores } = validarCredenciales(req.body);
  if (errores.length) return res.status(400).json({ error: errores.join('; '), errores });

  const existente = db.list('usuarios').find(u => u.email === email);
  // Cuentas viejas sin clave (versión anterior) se pueden reclamar registrándose de nuevo
  if (existente && existente.passwordHash) return res.status(409).json({ error: 'El correo ya está registrado' });

  const usuario = existente
    ? db.update('usuarios', existente.id, { passwordHash: hashPassword(password), rol: existente.rol || 'voluntario' })
    : db.insert('usuarios', { email, rol: 'voluntario', passwordHash: hashPassword(password) });
  res.status(201).json({ success: true, data: { usuario: publico(usuario), token: crearToken(usuario.id) } });
});

// POST /api/usuarios/login { email, password } → { usuario, token }
router.post('/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const usuario = db.list('usuarios').find(u => u.email === email);
  if (!usuario || !verificarPassword(String(req.body.password || ''), usuario.passwordHash)) {
    return res.status(401).json({ error: 'Correo o clave incorrectos' });
  }
  res.json({ success: true, data: { usuario: publico(usuario), token: crearToken(usuario.id) } });
});

// GET /api/usuarios/yo → usuario de la sesión
router.get('/yo', requiereUsuario, (req, res) => {
  res.json({ success: true, data: publico(req.usuario) });
});

// ── Solo administradores ──────────────────────────────────────────────────────

router.get('/', requiereAdmin, (req, res) => {
  res.json({ success: true, data: db.list('usuarios').map(publico) });
});

// PUT /api/usuarios/:id/rol { rol: 'admin' | 'voluntario' }
router.put('/:id/rol', requiereAdmin, (req, res) => {
  const usuario = db.get('usuarios', req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { rol } = req.body;
  if (!['admin', 'voluntario'].includes(rol)) return res.status(400).json({ error: 'rol debe ser admin o voluntario' });
  if (usuario.id === req.usuario.id && rol !== 'admin') {
    return res.status(400).json({ error: 'No puedes quitarte el rol de administrador a ti mismo' });
  }
  res.json({ success: true, data: publico(db.update('usuarios', usuario.id, { rol })) });
});

router.delete('/:id', requiereAdmin, (req, res) => {
  if (req.params.id === req.usuario.id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  if (!db.remove('usuarios', req.params.id)) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ success: true });
});

module.exports = router;
