const { crudRouter } = require('../lib/crud');

// Kg de poda de Ficus benjamina entregados en un punto de acopio
module.exports = crudRouter('entregasPoda', {
  puntoId: { type: 'string', required: true, ref: 'puntosAcopio' },
  kg: { type: 'number', required: true, min: 0.1 },
  tipoMaterial: { type: 'string', ref: 'tiposMaterial' },
  especieArbol: { type: 'string' }, // ej. Ficus benjamina, fresno, jacaranda
  usuarioId: { type: 'string', ref: 'usuarios' },
  notas: { type: 'string' },
});
