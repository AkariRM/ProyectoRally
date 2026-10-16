// Inventario de biomasa (poda urbana: hojas, ramillas, ramas y pasto), calculado a partir
// de los movimientos:
//   entregas de poda       → fresca
//   proceso 'secado'       → fresca → seca (al sol)
//   proceso 'triturado'    → seca   → triturada (escamas de 2–3 mm de hojas y ramillas)
//   proceso 'pirolisis'    → seca   → biochar (ramas, > 450 °C sin oxígeno)
//   proceso 'molienda'     → seca   → harina (pasto y hojas)
//   lotes                  → triturada / biochar / harina → usada en píldoras

const db = require('./db');

const PRODUCTOS = { triturado: 'triturada', pirolisis: 'biochar', molienda: 'harina' };

const sum = (items, campo) => items.reduce((t, i) => t + (Number(i[campo]) || 0), 0);
const r2 = n => Math.round(n * 100) / 100;

// kg que tomó un lote de cada inventario (lotes anteriores solo tenían kgFicus = escamas)
function consumoDeLote(lote) {
  if (lote.consumo) return lote.consumo;
  return lote.kgFicus ? { triturada: lote.kgFicus } : {};
}

function inventario() {
  const procesos = db.list('procesosBiomasa');
  const delTipo = tipo => procesos.filter(p => p.tipo === tipo);
  const secados = delTipo('secado');

  const recibida = sum(db.list('entregasPoda'), 'kg');
  const frescaSecada = sum(secados, 'kgEntrada');
  const secaObtenida = sum(secados, 'kgSalida');

  // Lo que sale de la biomasa seca hacia cada producto
  const secaUsada = Object.keys(PRODUCTOS).reduce((t, tipo) => t + sum(delTipo(tipo), 'kgEntrada'), 0);

  const usadaPor = { triturada: 0, biochar: 0, harina: 0 };
  for (const lote of db.list('lotes')) {
    for (const [recurso, kg] of Object.entries(consumoDeLote(lote))) usadaPor[recurso] = (usadaPor[recurso] || 0) + kg;
  }

  const producida = {};
  const existencias = {};
  const rendimientos = {};
  for (const [tipo, producto] of Object.entries(PRODUCTOS)) {
    const entrada = sum(delTipo(tipo), 'kgEntrada');
    producida[producto] = sum(delTipo(tipo), 'kgSalida');
    existencias[producto] = r2(producida[producto] - (usadaPor[producto] || 0));
    rendimientos[producto] = entrada ? r2((producida[producto] / entrada) * 100) : null;
  }

  const recibidaPorTipo = {};
  for (const e of db.list('entregasPoda')) {
    const t = e.tipoMaterial || 'sin clasificar';
    recibidaPorTipo[t] = r2((recibidaPorTipo[t] || 0) + e.kg);
  }

  const porFraccion = {};
  for (const t of delTipo('triturado')) {
    const f = t.fraccion || 'sin clasificar';
    porFraccion[f] = r2((porFraccion[f] || 0) + t.kgSalida);
  }

  const usada = Object.values(usadaPor).reduce((t, v) => t + v, 0);

  return {
    // existencias actuales
    fresca: r2(recibida - frescaSecada),
    seca: r2(secaObtenida - secaUsada),
    triturada: existencias.triturada,
    biochar: existencias.biochar,
    harina: existencias.harina,
    // acumulados
    recibida: r2(recibida),
    secaObtenida: r2(secaObtenida),
    trituradaObtenida: r2(producida.triturada),
    biocharObtenido: r2(producida.biochar),
    harinaObtenida: r2(producida.harina),
    usada: r2(usada),
    usadaPor: Object.fromEntries(Object.entries(usadaPor).map(([k, v]) => [k, r2(v)])),
    trituradaPorFraccion: porFraccion,
    recibidaPorTipo,
    // rendimientos (%)
    perdidaSecado: frescaSecada ? r2(((frescaSecada - secaObtenida) / frescaSecada) * 100) : null,
    rendimientoTriturado: rendimientos.triturada,
    rendimientoPirolisis: rendimientos.biochar,
    rendimientoMolienda: rendimientos.harina,
  };
}

module.exports = { inventario, PRODUCTOS };
