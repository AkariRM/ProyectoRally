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
function catalogoRouter(coleccion, schema, usos) {
  return crudRouter(coleccion, schema, {
    soloAdmin: true,
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
