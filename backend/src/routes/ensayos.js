const express = require('express');
const { crudRouter } = require('../lib/crud');

// Mediciones de laboratorio capturadas a mano (sin sensores) para comparar mezclas.
const TRATAMIENTOS = ['A-arcilla', 'B-arcilla+compost', 'C-arcilla+compost+ficus', 'otro'];
const PRUEBAS = {
  retencionAgua: '%', // por peso: (húmeda - seca) / seca × 100
  perdidaAgua24h: '%', // % del agua absorbida que se perdió en 24 h a la sombra
  germinacion: '%',
  grietas: 'num', // grietas visibles por píldora al secar
  caida: 'num', // caídas desde 1 m que resiste sin romperse
  desintegracion: 'min', // minutos en agua hasta deshacerse
  secado: 'h', // horas hasta peso constante
};

const router = express.Router();

router.get('/catalogo', (req, res) => {
  res.json({ success: true, data: { tratamientos: TRATAMIENTOS, pruebas: PRUEBAS } });
});

router.use(
  crudRouter(
    'ensayos',
    {
      tratamiento: { type: 'enum', required: true, values: TRATAMIENTOS },
      prueba: { type: 'enum', required: true, values: Object.keys(PRUEBAS) },
      valor: { type: 'number', required: true },
      unidad: { type: 'string' },
      repeticion: { type: 'number', min: 1 },
      loteId: { type: 'string', ref: 'lotes' },
      usuarioId: { type: 'string', ref: 'usuarios' },
      notas: { type: 'string' },
    },
    {
      beforeCreate: data => ({ ...data, unidad: PRUEBAS[data.prueba] }),
    },
  ),
);

module.exports = router;
