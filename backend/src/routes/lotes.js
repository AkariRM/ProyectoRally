const { crudRouter } = require('../lib/crud');
const { inventario } = require('../lib/biomasa');
const db = require('../lib/db');

const PESO_PILDORA_G = 20;

// Lotes de producción de píldoras. La mezcla se guarda en porcentaje (peso seco).
// kgFicus (fibra triturada usada) se calcula y se descuenta del inventario de biomasa.
module.exports = crudRouter(
  'lotes',
  {
    codigo: { type: 'string' },
    especieId: { type: 'string', required: true, ref: 'especies' },
    cantidad: { type: 'number', required: true, min: 1 },
    arcillaPct: { type: 'number', required: true, min: 0, max: 100 },
    compostPct: { type: 'number', required: true, min: 0, max: 100 },
    ficusPct: { type: 'number', required: true, min: 0, max: 100 },
    pesoPildoraG: { type: 'number', min: 1 },
    semillasPorPildora: { type: 'number', min: 1 },
    diametroMm: { type: 'number', min: 1 },
    aditivos: { type: 'object' }, // lista, ej. ['micorrizas']
    aditivosDetalle: { type: 'string' }, // dosis, cepa, proveedor…
    usuarioId: { type: 'string', ref: 'usuarios' },
    notas: { type: 'string' },
  },
  {
    validate: data => {
      const errores = [];
      const suma = (data.arcillaPct || 0) + (data.compostPct || 0) + (data.ficusPct || 0);
      if (Math.abs(suma - 100) > 0.5) errores.push(`la mezcla debe sumar 100% (suma ${suma}%)`);
      if (data.aditivos !== undefined && !(Array.isArray(data.aditivos) && data.aditivos.every(a => db.get('aditivos', a)))) {
        errores.push(`aditivos debe ser una lista de ids del catálogo de aditivos: ${db.list('aditivos').map(a => a.id).join(', ')}`);
      }
      return errores;
    },
    beforeCreate: data => {
      const pesoPildoraG = data.pesoPildoraG || PESO_PILDORA_G;
      const kgFicus = Math.round(((data.cantidad * pesoPildoraG * data.ficusPct) / 100 / 1000) * 1000) / 1000;
      const disponible = inventario().triturada;
      const lote = {
        semillasPorPildora: 1,
        ...data,
        pesoPildoraG,
        kgFicus,
        codigo: data.codigo || `L-${String(db.list('lotes').length + 1).padStart(3, '0')}`,
      };
      // No se bloquea (pueden ser lotes de prueba), pero queda registrado
      if (kgFicus > disponible) {
        lote.advertencia = `Se usaron ${kgFicus} kg de ficus triturado pero solo había ${disponible} kg registrados`;
      }
      return lote;
    },
  },
);
