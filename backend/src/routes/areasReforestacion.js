const { crudRouter } = require('../lib/crud');
const db = require('../lib/db');
const { validarFecha } = require('../lib/fechas');

// Áreas a reforestar: laderas quemadas o degradadas (definidas por Arquitectura).
// Se representan como círculo (lat, lng, radioM); opcionalmente un polígono
// [[lat, lng], ...] importado de QGIS.
const RIESGOS = ['bajo', 'medio', 'alto'];
const ESTADOS = ['quemada', 'degradada', 'en reforestación', 'recuperada'];

module.exports = crudRouter(
  'areasReforestacion',
  {
    nombre: { type: 'string', required: true },
    municipio: { type: 'enum', values: ['Jiquilpan', 'Sahuayo', 'Otro'] },
    lat: { type: 'number', required: true, min: -90, max: 90 },
    lng: { type: 'number', required: true, min: -180, max: 180 },
    radioM: { type: 'number', min: 10, max: 10000 },
    poligono: { type: 'object' },
    riesgoIncendio: { type: 'enum', values: RIESGOS },
    estado: { type: 'enum', values: ESTADOS },
    fechaIncendio: { type: 'string' },
    hectareas: { type: 'number', min: 0 },
    especiesRecomendadas: { type: 'object' }, // lista de ids de especies
    usuarioId: { type: 'string', ref: 'usuarios' },
    notas: { type: 'string' },
  },
  {
    roles: ['brigadista'],
    validate: data => {
      const errores = [...validarFecha('fechaIncendio', data.fechaIncendio)];
      if (data.poligono !== undefined) {
        const ok = Array.isArray(data.poligono) && data.poligono.length >= 3 &&
          data.poligono.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
        if (!ok) errores.push('poligono debe ser una lista de al menos 3 puntos [lat, lng]');
      }
      if (data.especiesRecomendadas !== undefined) {
        const ok = Array.isArray(data.especiesRecomendadas) && data.especiesRecomendadas.every(id => db.get('especies', id));
        if (!ok) errores.push('especiesRecomendadas debe ser una lista de ids de especies existentes');
      }
      return errores;
    },
    beforeCreate: data => ({ radioM: 300, estado: 'quemada', riesgoIncendio: 'alto', especiesRecomendadas: [], ...data }),
    beforeDelete: area => {
      const disp = db.list('dispersiones').filter(d => d.areaId === area.id).length;
      const jornadas = db.list('jornadasReforestacion').filter(j => j.areaId === area.id).length;
      return disp || jornadas
        ? `No se puede eliminar: tiene ${disp} dispersión(es) y ${jornadas} jornada(s). Cambia su estado en lugar de borrarla.`
        : null;
    },
  },
);

module.exports.RIESGOS = RIESGOS;
module.exports.ESTADOS = ESTADOS;
