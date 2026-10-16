// Balance de masa por componente (documento de la problemática):
//   m_j = Σ_i ( m_insumo_i × x_j,i )        w_j = m_j / M_total × 100
// donde m_insumo_i es la masa del ingrediente i y x_j,i la fracción másica del
// componente j en ese ingrediente (catálogo de ingredientes, base seca).

const db = require('./db');

const COMPONENTES = ['celulosa', 'hemicelulosa', 'lignina', 'polifenoles', 'extractivos', 'cenizas', 'poliisoprenoides'];

const r2 = n => Math.round(n * 100) / 100;

// ingredientes: [{ ingredienteId, gramos }]
function balanceDeMasa(ingredientes) {
  const masaTotalG = ingredientes.reduce((t, i) => t + (Number(i.gramos) || 0), 0);
  const componentes = {};
  for (const comp of COMPONENTES) {
    const gramos = ingredientes.reduce((t, i) => {
      const ing = db.get('ingredientes', i.ingredienteId);
      return t + (Number(i.gramos) || 0) * (Number(ing?.fracciones?.[comp]) || 0);
    }, 0);
    componentes[comp] = { gramos: r2(gramos), porcentaje: masaTotalG ? r2((gramos / masaTotalG) * 100) : 0 };
  }
  return { masaTotalG: r2(masaTotalG), componentes };
}

// kg que el lote toma de cada inventario de biomasa (triturada, biochar, harina)
function consumoDeBiomasa(ingredientes) {
  const consumo = {};
  for (const i of ingredientes) {
    const recurso = db.get('ingredientes', i.ingredienteId)?.recurso;
    if (recurso) consumo[recurso] = Math.round(((consumo[recurso] || 0) + Number(i.gramos) / 1000) * 1000) / 1000;
  }
  return consumo;
}

module.exports = { COMPONENTES, balanceDeMasa, consumoDeBiomasa };
