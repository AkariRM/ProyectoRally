require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/especies', require('./routes/especies'));
app.use('/api/puntos-acopio', require('./routes/puntosAcopio'));
app.use('/api/entregas-poda', require('./routes/entregasPoda'));
app.use('/api/procesos-biomasa', require('./routes/procesosBiomasa'));
app.use('/api/solicitudes', require('./routes/solicitudes'));
app.use('/api/zonas-poda', require('./routes/zonasPoda'));
app.use('/api/jornadas', require('./routes/jornadas'));
app.use('/api/lotes', require('./routes/lotes'));
app.use('/api/dispersiones', require('./routes/dispersiones'));
app.use('/api/seguimientos', require('./routes/seguimientos'));
app.use('/api/ensayos', require('./routes/ensayos'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/stats', require('./routes/stats'));

// Borra todos los datos y vuelve a los datos iniciales (solo en desarrollo)
app.post('/api/admin/reset', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'No permitido' });
  db.reset();
  res.json({ success: true });
});

// Ruta base de salud
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    proyecto: 'Píldoras Bióticas con Ficus benjamina',
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

if (require.main === module) {
  // 0.0.0.0 para que el celular en la misma red Wi-Fi pueda conectarse
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌱 API Píldoras Bióticas en http://localhost:${PORT}`);
  });
}

module.exports = app;
