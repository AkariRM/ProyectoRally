const { crudRouter } = require('../lib/crud');

// Lugares donde se recibe la poda de Ficus benjamina
module.exports = crudRouter('puntosAcopio', {
  nombre: { type: 'string', required: true },
  direccion: { type: 'string', required: true },
  municipio: { type: 'enum', values: ['Jiquilpan', 'Sahuayo', 'Otro'] },
  lat: { type: 'number', min: -90, max: 90 },
  lng: { type: 'number', min: -180, max: 180 },
  tipo: { type: 'enum', values: ['parque', 'plaza', 'escuela', 'vivero', 'domicilio', 'otro'] },
});
