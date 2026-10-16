const { crudRouter } = require('../lib/crud');
const db = require('../lib/db');

// Lugares donde se recibe la poda de Ficus benjamina (solo admin los modifica)
module.exports = crudRouter('puntosAcopio', {
  nombre: { type: 'string', required: true },
  direccion: { type: 'string', required: true },
  municipio: { type: 'enum', values: ['Jiquilpan', 'Sahuayo', 'Otro'] },
  lat: { type: 'number', min: -90, max: 90 },
  lng: { type: 'number', min: -180, max: 180 },
  tipo: { type: 'enum', values: ['parque', 'plaza', 'escuela', 'vivero', 'domicilio', 'otro'] },
}, {
  soloAdmin: true,
  // No se borra un punto con historial; se puede editar en su lugar
  beforeDelete: punto => {
    const entregas = db.list('entregasPoda').filter(e => e.puntoId === punto.id).length;
    const zonas = db.list('zonasPoda').filter(z => z.puntoDestinoId === punto.id).length;
    if (entregas || zonas) {
      return `No se puede eliminar: tiene ${entregas} entrega(s) y es destino de ${zonas} zona(s). Edítalo o cambia el destino de las zonas.`;
    }
    return null;
  },
});
