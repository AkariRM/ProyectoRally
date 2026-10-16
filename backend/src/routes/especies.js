const { crudRouter } = require('../lib/crud');

// Catálogo de especies nativas
module.exports = crudRouter('especies', {
  nombreComun: { type: 'string', required: true },
  nombreCientifico: { type: 'string', required: true },
  tipo: { type: 'string' },
  temporadaSiembra: { type: 'string' },
  tratamientoPregerminativo: { type: 'string' },
  validada: { type: 'enum', values: [true, false] },
}, { soloAdmin: true });
