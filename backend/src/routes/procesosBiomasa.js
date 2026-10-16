const express = require('express');
const { crudRouter } = require('../lib/crud');
const { inventario } = require('../lib/biomasa');

// Procesos que transforman la biomasa (kgEntrada → kgSalida):
//   secado:    poda fresca → poda seca (al sol)
//   triturado: poda seca   → escamas de 2–3 mm (hojas y ramillas tiernas)
//   pirolisis: poda seca   → biochar (ramas, > 450 °C sin oxígeno)
//   molienda:  poda seca   → harina (pasto y hojas)
const ORIGEN = { secado: 'fresca', triturado: 'seca', pirolisis: 'seca', molienda: 'seca' };

const router = express.Router();

router.get('/inventario', (req, res) => {
  res.json({ success: true, data: inventario() });
});

router.use(
  crudRouter(
    'procesosBiomasa',
    {
      tipo: { type: 'enum', required: true, values: Object.keys(ORIGEN) },
      kgEntrada: { type: 'number', required: true, min: 0.01 },
      kgSalida: { type: 'number', required: true, min: 0 },
      fraccion: { type: 'enum', values: ['fina', 'media', 'mixta'] }, // triturado: fina = escamas 2–3 mm (objetivo)
      temperaturaC: { type: 'number', min: 0, max: 1500 }, // pirólisis (> 450 °C)
      metodo: { type: 'string' }, // ej. "sombra 10 días", "licuadora"
      dias: { type: 'number', min: 0 },
      usuarioId: { type: 'string', ref: 'usuarios' },
      notas: { type: 'string' },
    },
    {
      validate: data => {
        const errores = [];
        if (data.kgSalida > data.kgEntrada) errores.push('kgSalida no puede ser mayor que kgEntrada');
        const origen = ORIGEN[data.tipo];
        if (origen) {
          const disponible = inventario()[origen];
          if (data.kgEntrada > disponible + 0.001) {
            errores.push(`solo hay ${disponible} kg de biomasa ${origen} disponible`);
          }
        }
        return errores;
      },
    },
  ),
);

module.exports = router;
