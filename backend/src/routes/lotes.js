const { crudRouter } = require('../lib/crud');
const { inventario } = require('../lib/biomasa');
const { balanceDeMasa, consumoDeBiomasa } = require('../lib/balance');
const db = require('../lib/db');

// Esferas del tamaño de una canica grande: 2–3 cm de diámetro (≈ 10 g secas)
const PESO_PILDORA_G = 10;
const DIAMETRO_MM = 25;

// Lotes de producción de píldoras. La mezcla se registra como ingredientes en gramos
// (normalmente a partir de una fórmula). Al crear el lote se calculan:
//  - cantidad de esferas (masa total / peso por esfera), si no se indica
//  - composicion: balance de masa por componente (celulosa, lignina, …)
//  - consumo: kg tomados de cada inventario de biomasa (escamas, biochar, harina)
module.exports = crudRouter(
  'lotes',
  {
    codigo: { type: 'string' },
    especieId: { type: 'string', required: true, ref: 'especies' },
    formulaId: { type: 'string', ref: 'formulas' },
    ingredientes: { type: 'object', required: true }, // [{ ingredienteId, gramos }]
    cantidad: { type: 'number', min: 1 },
    pesoPildoraG: { type: 'number', min: 1 },
    diametroMm: { type: 'number', min: 5, max: 100 },
    semillasPorPildora: { type: 'number', min: 1 },
    aditivos: { type: 'object' }, // lista de ids del catálogo, ej. ['micorrizas']
    aditivosDetalle: { type: 'string' }, // dosis, cepa, proveedor…
    usuarioId: { type: 'string', ref: 'usuarios' },
    notas: { type: 'string' },
  },
  {
    validate: data => {
      const errores = [];
      if (data.ingredientes !== undefined) {
        const lista = data.ingredientes;
        if (!Array.isArray(lista) || !lista.length) {
          errores.push('ingredientes debe ser una lista [{ ingredienteId, gramos }]');
        } else {
          for (const i of lista) {
            if (!db.get('ingredientes', i.ingredienteId)) errores.push(`no existe el ingrediente ${i.ingredienteId}`);
            if (!(typeof i.gramos === 'number' && i.gramos > 0)) errores.push('los gramos de cada ingrediente deben ser mayores que 0');
          }
        }
      }
      if (data.aditivos !== undefined && !(Array.isArray(data.aditivos) && data.aditivos.every(a => db.get('aditivos', a)))) {
        errores.push(`aditivos debe ser una lista de ids del catálogo de aditivos: ${db.list('aditivos').map(a => a.id).join(', ')}`);
      }
      return errores;
    },
    beforeCreate: data => {
      const pesoPildoraG = data.pesoPildoraG || PESO_PILDORA_G;
      const composicion = balanceDeMasa(data.ingredientes);
      const consumo = consumoDeBiomasa(data.ingredientes);
      const cantidad = data.cantidad || Math.max(1, Math.floor(composicion.masaTotalG / pesoPildoraG));
      const diametroMm = data.diametroMm || DIAMETRO_MM;

      // No se bloquea (pueden ser lotes de prueba), pero quedan registradas
      const advertencias = [];
      const inv = inventario();
      for (const [recurso, kg] of Object.entries(consumo)) {
        if (kg > (inv[recurso] || 0)) advertencias.push(`Se usaron ${kg} kg de ${recurso} pero solo había ${inv[recurso] || 0} kg registrados`);
      }
      if (diametroMm < 20 || diametroMm > 30) advertencias.push(`El diámetro recomendado es de 20 a 30 mm (se registró ${diametroMm} mm)`);

      return {
        semillasPorPildora: 1,
        ...data,
        pesoPildoraG,
        diametroMm,
        cantidad,
        composicion,
        consumo,
        ...(advertencias.length ? { advertencia: advertencias.join('. ') } : {}),
        codigo: data.codigo || `L-${String(db.list('lotes').length + 1).padStart(3, '0')}`,
      };
    },
  },
);
