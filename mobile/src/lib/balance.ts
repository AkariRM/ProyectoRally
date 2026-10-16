import type { Composicion, Ingrediente, IngredienteLote } from './types';

// Mismo balance de masa que el servidor (backend/src/lib/balance.js), para la vista previa:
//   m_j = Σ_i m_i × x_j,i      w_j = m_j / M_total × 100
export function balanceDeMasa(filas: IngredienteLote[], ingredientes: Ingrediente[], componentes: string[]): Composicion {
  const porId = Object.fromEntries(ingredientes.map(i => [i.id, i]));
  const masaTotalG = filas.reduce((t, f) => t + (f.gramos || 0), 0);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const resultado: Composicion = { masaTotalG: r2(masaTotalG), componentes: {} };
  for (const comp of componentes) {
    const gramos = filas.reduce((t, f) => t + (f.gramos || 0) * (porId[f.ingredienteId]?.fracciones?.[comp] || 0), 0);
    resultado.componentes[comp] = { gramos: r2(gramos), porcentaje: masaTotalG ? r2((gramos / masaTotalG) * 100) : 0 };
  }
  return resultado;
}

// kg que se tomarían de cada inventario de biomasa
export function consumoDeBiomasa(filas: IngredienteLote[], ingredientes: Ingrediente[]) {
  const porId = Object.fromEntries(ingredientes.map(i => [i.id, i]));
  const consumo: Record<string, number> = {};
  for (const f of filas) {
    const recurso = porId[f.ingredienteId]?.recurso;
    if (recurso) consumo[recurso] = Math.round(((consumo[recurso] || 0) + (f.gramos || 0) / 1000) * 1000) / 1000;
  }
  return consumo;
}

export const NOMBRE_RECURSO: Record<string, string> = {
  triturada: 'escamas de ficus',
  biochar: 'biochar',
  harina: 'harina de pasto y hojas',
};

export const NOMBRE_COMPONENTE: Record<string, string> = {
  celulosa: 'Celulosa',
  hemicelulosa: 'Hemicelulosa / pectinas',
  lignina: 'Lignina',
  polifenoles: 'Polifenoles / taninos',
  extractivos: 'Extractivos (ceras, lípidos)',
  cenizas: 'Cenizas (minerales)',
  poliisoprenoides: 'Poliisoprenoides (látex)',
};
