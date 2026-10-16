const { crudRouter } = require('../lib/crud');

// Revisión en campo de una dispersión: cuántas plántulas germinaron y siguen vivas
module.exports = crudRouter(
  'seguimientos',
  {
    dispersionId: { type: 'string', required: true, ref: 'dispersiones' },
    germinadas: { type: 'number', required: true, min: 0 },
    vivas: { type: 'number', min: 0 },
    humedadSuelo: { type: 'enum', values: ['seco', 'húmedo', 'encharcado'] }, // a simple vista / al tacto
    usuarioId: { type: 'string', ref: 'usuarios' },
    notas: { type: 'string' },
  },
  {
    validate: data =>
      data.vivas !== undefined && data.vivas > data.germinadas
        ? ['vivas no puede ser mayor que germinadas']
        : [],
  },
);
