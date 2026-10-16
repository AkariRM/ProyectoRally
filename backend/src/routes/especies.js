const { crudRouter } = require('../lib/crud');
const { contar, describir } = require('../lib/catalogos');

// Catálogo de especies nativas
module.exports = crudRouter('especies', {
  nombreComun: { type: 'string', required: true },
  nombreCientifico: { type: 'string', required: true },
  tipo: { type: 'string' },
  temporadaSiembra: { type: 'string' },
  tratamientoPregerminativo: { type: 'string' },
  validada: { type: 'enum', values: [true, false] },
  notas: { type: 'string' },
}, {
  soloAdmin: true,
  beforeDelete: especie => {
    const uso = describir([
      [contar('lotes', l => l.especieId === especie.id), 'lote(s)'],
      [contar('dispersiones', d => d.especieId === especie.id), 'dispersión(es)'],
      [contar('areasReforestacion', a => (a.especiesRecomendadas || []).includes(especie.id)), 'área(s)'],
    ]);
    return uso ? `No se puede eliminar "${especie.nombreComun}": se usa en ${uso}. Puedes editarla.` : null;
  },
});
