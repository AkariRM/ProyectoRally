const { crudRouter } = require('../lib/crud');
const db = require('../lib/db');

// Lugar y fecha donde se lanzaron píldoras
module.exports = crudRouter(
  'dispersiones',
  {
    lat: { type: 'number', required: true, min: -90, max: 90 },
    lng: { type: 'number', required: true, min: -180, max: 180 },
    zona: { type: 'string', required: true },
    municipio: { type: 'enum', values: ['Jiquilpan', 'Sahuayo', 'Otro'] },
    loteId: { type: 'string', ref: 'lotes' },
    especieId: { type: 'string', ref: 'especies' },
    cantidad: { type: 'number', required: true, min: 1 },
    usuarioId: { type: 'string', ref: 'usuarios' },
    notas: { type: 'string' },
  },
  {
    validate: data => (!data.loteId && !data.especieId ? ['indica loteId o especieId'] : []),
    // Si viene de un lote, hereda la especie del lote
    beforeCreate: data => {
      const lote = data.loteId && db.get('lotes', data.loteId);
      return lote && !data.especieId ? { ...data, especieId: lote.especieId } : data;
    },
  },
);
