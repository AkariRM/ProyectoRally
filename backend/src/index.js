require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./lib/db');
const { autenticar, asegurarAdmin, requiereAdmin } = require('./lib/auth');

// En producción las sesiones necesitan AUTH_SECRET; sin ella cada inicio de sesión daría error 500
if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
  console.error('❌ Falta la variable de entorno AUTH_SECRET. Agrégala en Render (Environment) y vuelve a desplegar.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(autenticar);

// Toda la API requiere sesión, excepto registrarse e iniciar sesión
const RUTAS_PUBLICAS = ['/usuarios/registro', '/usuarios/login'];
app.use('/api', (req, res, next) => {
  if (RUTAS_PUBLICAS.includes(req.path) || req.usuario) return next();
  res.status(401).json({ error: 'Inicia sesión para continuar' });
});

// Cuenta de administrador definida en .env (ADMIN_EMAIL / ADMIN_PASSWORD).
// Con PostgreSQL se crea al arrancar, cuando ya se cargaron los datos (ver iniciar()).
if (!db.usaPostgres()) asegurarAdmin();

// Rutas
app.use('/api/especies', require('./routes/especies'));
const { routers: catalogos } = require('./lib/catalogos');
app.use('/api/tratamientos', catalogos.tratamientos);
app.use('/api/pruebas', catalogos.pruebas);
app.use('/api/aditivos', catalogos.aditivos);
app.use('/api/tipos-material', catalogos.tiposMaterial);
app.use('/api/puntos-acopio', require('./routes/puntosAcopio'));
app.use('/api/entregas-poda', require('./routes/entregasPoda'));
app.use('/api/procesos-biomasa', require('./routes/procesosBiomasa'));
app.use('/api/solicitudes', require('./routes/solicitudes'));
app.use('/api/zonas-poda', require('./routes/zonasPoda'));
app.use('/api/jornadas', require('./routes/jornadas'));
app.use('/api/areas-reforestacion', require('./routes/areasReforestacion'));
app.use('/api/jornadas-reforestacion', require('./routes/jornadasReforestacion'));
app.use('/api/lotes', require('./routes/lotes'));
app.use('/api/dispersiones', require('./routes/dispersiones'));
app.use('/api/seguimientos', require('./routes/seguimientos'));
app.use('/api/ensayos', require('./routes/ensayos'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/exportar', require('./routes/exportar'));
app.use('/api/ruta', require('./routes/ruta'));

// Catálogos para los formularios de la app
app.get('/api/catalogos', (req, res) => {
  const { RIESGOS, ESTADOS } = require('./routes/areasReforestacion');
  const { ROLES } = require('./lib/auth');
  res.json({
    success: true,
    data: {
      tiposMaterial: db.list('tiposMaterial'),
      aditivos: db.list('aditivos'),
      tratamientos: db.list('tratamientos'),
      pruebas: db.list('pruebas'),
      riesgos: RIESGOS,
      estadosArea: ESTADOS,
      roles: ROLES,
    },
  });
});

// Borra todos los datos y vuelve a los datos iniciales (solo admin, no en producción)
app.post('/api/admin/reset', requiereAdmin, (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'No permitido' });
  db.reset();
  asegurarAdmin();
  res.json({ success: true });
});

// Ruta base de salud
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    proyecto: 'Bio Red — Píldoras bióticas con poda urbana',
    version: '2.0.0',
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

async function iniciar() {
  await db.init();
  asegurarAdmin();
  // 0.0.0.0 para que el celular en la misma red Wi-Fi pueda conectarse
  const servidor = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌱 API Bio Red en http://localhost:${PORT} (${db.usaPostgres() ? 'PostgreSQL' : 'archivo JSON'})`);
  });
  // Al detener el servidor (deploy, Ctrl+C) se terminan de guardar los cambios pendientes
  const apagar = () => servidor.close(() => db.cerrar().finally(() => process.exit(0)));
  process.on('SIGTERM', apagar);
  process.on('SIGINT', apagar);
}

if (require.main === module) {
  iniciar().catch(e => {
    console.error('❌ No se pudo iniciar:', e.message);
    process.exit(1);
  });
}

module.exports = app;
