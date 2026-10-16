// Inventario de biomasa de Ficus benjamina, calculado a partir de los movimientos:
//   entregas de poda  → fresca
//   proceso 'secado'  → fresca  → seca
//   proceso 'triturado' → seca  → triturada
//   lotes (kgFicus)   → triturada → usada

const db = require('./db');

const sum = (items, campo) => items.reduce((t, i) => t + (Number(i[campo]) || 0), 0);
const r2 = n => Math.round(n * 100) / 100;

function inventario() {
  const procesos = db.list('procesosBiomasa');
  const secados = procesos.filter(p => p.tipo === 'secado');
  const triturados = procesos.filter(p => p.tipo === 'triturado');

  const recibida = sum(db.list('entregasPoda'), 'kg');
  const frescaSecada = sum(secados, 'kgEntrada');
  const secaObtenida = sum(secados, 'kgSalida');
  const secaTriturada = sum(triturados, 'kgEntrada');
  const trituradaObtenida = sum(triturados, 'kgSalida');
  const usada = sum(db.list('lotes'), 'kgFicus');

  const recibidaPorTipo = {};
  for (const e of db.list('entregasPoda')) {
    const t = e.tipoMaterial || 'sin clasificar';
    recibidaPorTipo[t] = r2((recibidaPorTipo[t] || 0) + e.kg);
  }

  const porFraccion = {};
  for (const t of triturados) {
    const f = t.fraccion || 'sin clasificar';
    porFraccion[f] = r2((porFraccion[f] || 0) + t.kgSalida);
  }

  return {
    // existencias actuales
    fresca: r2(recibida - frescaSecada),
    seca: r2(secaObtenida - secaTriturada),
    triturada: r2(trituradaObtenida - usada),
    // acumulados
    recibida: r2(recibida),
    secaObtenida: r2(secaObtenida),
    trituradaObtenida: r2(trituradaObtenida),
    usada: r2(usada),
    trituradaPorFraccion: porFraccion,
    recibidaPorTipo,
    // rendimientos (%)
    perdidaSecado: frescaSecada ? r2(((frescaSecada - secaObtenida) / frescaSecada) * 100) : null,
    rendimientoTriturado: secaTriturada ? r2((trituradaObtenida / secaTriturada) * 100) : null,
  };
}

module.exports = { inventario };
