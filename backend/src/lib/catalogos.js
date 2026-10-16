// Catálogos editables (tratamientos, pruebas, aditivos, tipos de material).
// Se guardan en la base de datos; solo admin los crea, edita o elimina.

const db = require('./db');
const { crudRouter } = require('./crud');

// "Bacterias fijadoras de N" → "bacterias-fijadoras-de-n"
const slug = texto =>
  String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';

function idUnico(coleccion, nombre) {
  const base = slug(nombre);
  let id = base;
  for (let i = 2; db.get(coleccion, id); i++) id = `${base}-${i}`;
  return id;
}

// usos(id) → texto con dónde se usa, o null si no se usa (entonces se puede borrar)
function catalogoRouter(coleccion, schema, usos, validar) {
  return crudRouter(coleccion, schema, {
    soloAdmin: true,
    validate: validar,
    beforeCreate: data => ({ ...data, id: idUnico(coleccion, data.nombre) }),
    beforeDelete: item => {
      const uso = usos(item.id);
      return uso ? `No se puede eliminar "${item.nombre}": se usa en ${uso}. Puedes editar su nombre.` : null;
    },
  });
}

const contar = (coleccion, filtro) => db.list(coleccion).filter(filtro).length;
const describir = partes => {
  const txt = partes.filter(([n]) => n > 0).map(([n, nombre]) => `${n} ${nombre}`).join(', ');
  return txt || null;
};

const routers = {
  tratamientos: catalogoRouter(
    'tratamientos',
    { nombre: { type: 'string', required: true }, descripcion: { type: 'string' } },
    id => describir([[contar('ensayos', e => e.tratamiento === id), 'ensayo(s)']]),
  ),
  pruebas: catalogoRouter(
    'pruebas',
    {
      nombre: { type: 'string', required: true },
      unidad: { type: 'string', required: true },
      instrucciones: { type: 'string' },
    },
    id => describir([[contar('ensayos', e => e.prueba === id), 'ensayo(s)']]),
  ),
  aditivos: catalogoRouter(
    'aditivos',
    { nombre: { type: 'string', required: true }, descripcion: { type: 'string' } },
    id => describir([[contar('lotes', l => (l.aditivos || []).includes(id)), 'lote(s)']]),
  ),
  ingredientes: catalogoRouter(
    'ingredientes',
    {
      nombre: { type: 'string', required: true },
      recurso: { type: 'enum', values: ['triturada', 'biochar', 'harina'] }, // inventario del que se descuenta
      fracciones: { type: 'object' }, // { celulosa: 0.35, lignina: 0.15, … } base seca, 0–1
      notas: { type: 'string' },
    },
    id => describir([
      [contar('lotes', l => (l.ingredientes || []).some(i => i.ingredienteId === id)), 'lote(s)'],
      [contar('formulas', f => (f.ingredientes || []).some(i => i.ingredienteId === id)), 'fórmula(s)'],
    ]),
    data => {
      if (data.fracciones === undefined) return [];
      const { COMPONENTES } = require('./balance');
      const f = data.fracciones;
      if (typeof f !== 'object' || Array.isArray(f)) return ['fracciones debe ser un objeto { componente: fracción }'];
      const errores = [];
      for (const [k, v] of Object.entries(f)) {
        if (!COMPONENTES.includes(k)) errores.push(`componente desconocido: ${k} (usa ${COMPONENTES.join(', ')})`);
        else if (!(typeof v === 'number' && v >= 0 && v <= 1)) errores.push(`la fracción de ${k} debe ser un número entre 0 y 1`);
      }
      const suma = Object.values(f).reduce((t, v) => t + (Number(v) || 0), 0);
      if (suma > 1.0001) errores.push(`las fracciones suman ${Math.round(suma * 1000) / 1000}; no pueden pasar de 1`);
      return errores;
    },
  ),
  formulas: catalogoRouter(
    'formulas',
    {
      nombre: { type: 'string', required: true },
      masaTotalG: { type: 'number', min: 1 },
      ingredientes: { type: 'object', required: true }, // [{ ingredienteId, porcentaje }]
      notas: { type: 'string' },
    },
    id => describir([[contar('lotes', l => l.formulaId === id), 'lote(s)']]),
    data => {
      if (data.ingredientes === undefined) return [];
      const lista = data.ingredientes;
      if (!Array.isArray(lista) || !lista.length) return ['ingredientes debe ser una lista [{ ingredienteId, porcentaje }]'];
      const errores = [];
      for (const i of lista) {
        if (!db.get('ingredientes', i.ingredienteId)) errores.push(`no existe el ingrediente ${i.ingredienteId}`);
        if (!(typeof i.porcentaje === 'number' && i.porcentaje > 0)) errores.push('cada porcentaje debe ser mayor que 0');
      }
      const suma = lista.reduce((t, i) => t + (Number(i.porcentaje) || 0), 0);
      if (Math.abs(suma - 100) > 0.5) errores.push(`los porcentajes deben sumar 100 (suman ${Math.round(suma * 100) / 100})`);
      return errores;
    },
  ),
  tiposMaterial: catalogoRouter(
    'tiposMaterial',
    { nombre: { type: 'string', required: true } },
    id => describir([
      [contar('entregasPoda', e => e.tipoMaterial === id), 'entrega(s)'],
      [contar('solicitudes', s => s.tipoMaterial === id), 'solicitud(es)'],
      [contar('jornadas', j => j.tipoMaterial === id), 'jornada(s)'],
    ]),
  ),
};

module.exports = { routers, describir, contar };
