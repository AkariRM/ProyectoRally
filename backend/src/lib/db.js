// Almacenamiento de datos con dos modos:
//
//  - PostgreSQL (Supabase), si existe DATABASE_URL: tabla public.documentos con
//    (coleccion, id, datos jsonb). Al arrancar se carga todo en memoria y cada cambio
//    se guarda de inmediato en la base (en orden, uno tras otro).
//  - Archivo JSON (data/db.json), si no hay DATABASE_URL: para desarrollo y pruebas.
//
// Las rutas solo usan list/get/insert/update/remove, así que no saben qué modo está activo.
// Pensado para una sola instancia del servidor (como en Render).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const seed = require('../data/seed');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'db.json');
// Las pruebas nunca tocan la base real (borran y recrean datos)
const DATABASE_URL = process.env.NODE_ENV === 'test' ? null : process.env.DATABASE_URL;
const TABLA = 'public.documentos';
const META = '_meta'; // registro con las colecciones ya inicializadas

let db = null;
let pool = null;
let cola = Promise.resolve();

const copia = x => JSON.parse(JSON.stringify(x));

// ── Modo archivo ──────────────────────────────────────────────────────────────

function cargarArchivo() {
  if (fs.existsSync(DB_PATH)) {
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } else {
    db = copia(seed);
    guardarArchivo();
  }
  // Colecciones nuevas en un archivo viejo: se crean con sus datos iniciales
  let cambio = false;
  for (const key of Object.keys(seed)) {
    if (!Array.isArray(db[key])) {
      db[key] = copia(seed[key]);
      cambio = true;
    }
  }
  if (cambio) guardarArchivo();
}

function guardarArchivo() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ── Modo PostgreSQL ───────────────────────────────────────────────────────────

// Las escrituras se encolan para que lleguen a la base en el mismo orden en que ocurren
function encolar(tarea) {
  cola = cola.then(tarea).catch(e => console.error('❌ Error guardando en PostgreSQL:', e.message));
  return cola;
}

const upsert = (cliente, coleccion, item) =>
  cliente.query(
    `insert into ${TABLA} (coleccion, id, datos, actualizado) values ($1, $2, $3, now())
     on conflict (coleccion, id) do update set datos = excluded.datos, actualizado = now()`,
    [coleccion, item.id, item],
  );

async function transaccion(fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query('begin');
    await fn(cliente);
    await cliente.query('commit');
  } catch (e) {
    await cliente.query('rollback').catch(() => {});
    throw e;
  } finally {
    cliente.release();
  }
}

async function iniciarPostgres() {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Supabase exige SSL
    max: 5,
  });

  // Versiones anteriores usaban el esquema bio_red: se mueve la tabla a public sin perder datos
  await pool.query(`
    do $$ begin
      if to_regclass('public.documentos') is null and to_regclass('bio_red.documentos') is not null then
        alter table bio_red.documentos set schema public;
      end if;
    end $$`);
  await pool.query(`drop schema if exists bio_red`).catch(() => {}); // solo si quedó vacío
  await pool.query(`
    create table if not exists ${TABLA} (
      coleccion text not null,
      id text not null,
      datos jsonb not null,
      actualizado timestamptz not null default now(),
      primary key (coleccion, id)
    )`);
  // La tabla está en public: RLS sin políticas y sin permisos para los roles de la API pública
  // de Supabase (anon / authenticated). Solo el backend, con la conexión directa, la usa.
  await pool.query(`alter table ${TABLA} enable row level security`);
  await pool.query(`revoke all on ${TABLA} from anon, authenticated`).catch(() => {});

  const { rows } = await pool.query(`select coleccion, datos from ${TABLA} order by datos->>'creadoEn' nulls first`);
  db = {};
  let inicializadas = [];
  for (const { coleccion, datos } of rows) {
    if (coleccion === META) {
      inicializadas = datos.inicializadas || [];
      continue;
    }
    (db[coleccion] = db[coleccion] || []).push(datos);
  }

  // Colecciones que nunca se han inicializado: se crean con sus datos iniciales.
  // (Si un admin borra todo de una colección, no se vuelve a llenar al reiniciar.)
  const nuevas = Object.keys(seed).filter(k => !inicializadas.includes(k));
  for (const key of Object.keys(seed)) {
    if (!Array.isArray(db[key])) db[key] = [];
  }
  if (nuevas.length) {
    await transaccion(async cliente => {
      for (const key of nuevas) {
        for (const item of seed[key]) {
          if (!db[key].some(x => x.id === item.id)) {
            db[key].push(copia(item));
            await upsert(cliente, key, item);
          }
        }
      }
      await upsert(cliente, META, { id: 'colecciones', inicializadas: Object.keys(seed) });
    });
    console.log(`🗄️  Colecciones inicializadas en PostgreSQL: ${nuevas.join(', ')}`);
  }
  const total = Object.values(db).reduce((t, items) => t + items.length, 0);
  console.log(`🗄️  PostgreSQL conectado (${total} registros)`);
}

// ── API común ─────────────────────────────────────────────────────────────────

const usaPostgres = () => !!DATABASE_URL;

// Llamar una vez al arrancar. En modo archivo no es obligatorio (se carga solo).
async function init() {
  if (db) return;
  if (usaPostgres()) await iniciarPostgres();
  else cargarArchivo();
}

function load() {
  if (db) return db;
  if (usaPostgres()) throw new Error('db.init() debe terminar antes de usar la base de datos');
  cargarArchivo();
  return db;
}

function list(collection) {
  return load()[collection];
}

function get(collection, id) {
  return list(collection).find(item => item.id === id) || null;
}

function insert(collection, data) {
  const item = { id: crypto.randomUUID(), ...data, creadoEn: new Date().toISOString() };
  list(collection).push(item);
  if (usaPostgres()) encolar(() => upsert(pool, collection, item));
  else guardarArchivo();
  return item;
}

function update(collection, id, data) {
  const items = list(collection);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...data, id };
  const item = items[index];
  if (usaPostgres()) encolar(() => upsert(pool, collection, item));
  else guardarArchivo();
  return item;
}

function remove(collection, id) {
  const items = list(collection);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  if (usaPostgres()) encolar(() => pool.query(`delete from ${TABLA} where coleccion = $1 and id = $2`, [collection, id]));
  else guardarArchivo();
  return true;
}

// Borra todo y vuelve a los datos iniciales
function reset() {
  db = copia(seed);
  if (usaPostgres()) {
    const datos = copia(seed);
    encolar(() =>
      transaccion(async cliente => {
        await cliente.query(`delete from ${TABLA}`);
        for (const [key, items] of Object.entries(datos)) {
          for (const item of items) await upsert(cliente, key, item);
        }
        await upsert(cliente, META, { id: 'colecciones', inicializadas: Object.keys(seed) });
      }),
    );
  } else {
    guardarArchivo();
  }
}

// Reemplaza todo el contenido (lo usa el script de migración)
async function reemplazarTodo(datos) {
  if (!usaPostgres()) throw new Error('reemplazarTodo solo funciona con DATABASE_URL');
  await init();
  await transaccion(async cliente => {
    await cliente.query(`delete from ${TABLA}`);
    for (const [key, items] of Object.entries(datos)) {
      for (const item of items) await upsert(cliente, key, item);
    }
    await upsert(cliente, META, { id: 'colecciones', inicializadas: [...new Set([...Object.keys(seed), ...Object.keys(datos)])] });
  });
  db = copia(datos);
}

// Espera a que terminen las escrituras pendientes y cierra la conexión
async function cerrar() {
  await cola;
  if (pool) await pool.end();
}

module.exports = { init, list, get, insert, update, remove, reset, reemplazarTodo, cerrar, usaPostgres };
