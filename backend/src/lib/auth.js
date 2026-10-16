// Autenticación sencilla sin dependencias externas:
//  - contraseñas con scrypt + sal
//  - token firmado con HMAC: <usuarioId>.<expira>.<firma>
//  - roles: 'admin', 'municipio' (gestiona la poda), 'brigadista' (gestiona la
//    reforestación) y 'voluntario'. El admin puede todo.

const crypto = require('crypto');
const db = require('./db');

const DURACION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const ROLES = ['admin', 'municipio', 'brigadista', 'voluntario'];

function secreto() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('Falta AUTH_SECRET en producción');
  return 'secreto-de-desarrollo-cambiar';
}

function hashPassword(password) {
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, sal, 64).toString('hex');
  return `${sal}:${hash}`;
}

function verificarPassword(password, guardado) {
  if (!guardado) return false;
  const [sal, hash] = guardado.split(':');
  const calculado = crypto.scryptSync(password, sal, 64);
  return crypto.timingSafeEqual(calculado, Buffer.from(hash, 'hex'));
}

const firmar = datos => crypto.createHmac('sha256', secreto()).update(datos).digest('base64url');

function crearToken(usuarioId) {
  const datos = `${usuarioId}.${Date.now() + DURACION_MS}`;
  return `${datos}.${firmar(datos)}`;
}

function leerToken(token) {
  const partes = String(token || '').split('.');
  if (partes.length !== 3) return null;
  const [usuarioId, expira, firma] = partes;
  const esperada = firmar(`${usuarioId}.${expira}`);
  if (firma.length !== esperada.length || !crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return null;
  if (Number(expira) < Date.now()) return null;
  return db.get('usuarios', usuarioId);
}

// Quita datos sensibles antes de enviar un usuario
const publico = u => {
  if (!u) return u;
  const { passwordHash, ...resto } = u;
  return resto;
};

// Lee el token (si viene) y deja el usuario en req.usuario.
// Las descargas de /api/exportar también aceptan ?token= para abrirlas desde el navegador.
function autenticar(req, res, next) {
  const [tipo, token] = String(req.headers.authorization || '').split(' ');
  if (tipo === 'Bearer') req.usuario = leerToken(token);
  else if (req.path.startsWith('/api/exportar/') && req.query.token) req.usuario = leerToken(req.query.token);
  else req.usuario = null;
  next();
}

function requiereUsuario(req, res, next) {
  if (!req.usuario) return res.status(401).json({ error: 'Inicia sesión para hacer esto' });
  next();
}

function requiereAdmin(req, res, next) {
  if (!req.usuario) return res.status(401).json({ error: 'Inicia sesión para hacer esto' });
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo un administrador puede hacer esto' });
  next();
}

const tieneRol = (usuario, roles) => !!usuario && (usuario.rol === 'admin' || roles.includes(usuario.rol));

// requiereRol('municipio') → admin o municipio
function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ error: 'Inicia sesión para hacer esto' });
    if (!tieneRol(req.usuario, roles)) {
      return res.status(403).json({ error: `Solo ${['admin', ...roles].join(' o ')} puede hacer esto` });
    }
    next();
  };
}

// Crea (o actualiza la clave de) la cuenta de administrador definida en .env
function asegurarAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || !password) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️  Sin ADMIN_EMAIL / ADMIN_PASSWORD en .env: no se creó cuenta de administrador');
    }
    return null;
  }
  const existente = db.list('usuarios').find(u => u.email === email);
  if (existente) {
    if (existente.rol !== 'admin' || !verificarPassword(password, existente.passwordHash)) {
      return db.update('usuarios', existente.id, { rol: 'admin', passwordHash: hashPassword(password) });
    }
    return existente;
  }
  return db.insert('usuarios', { email, rol: 'admin', passwordHash: hashPassword(password) });
}

module.exports = {
  ROLES, hashPassword, verificarPassword, crearToken, leerToken, publico,
  autenticar, requiereUsuario, requiereAdmin, requiereRol, tieneRol, asegurarAdmin,
};
