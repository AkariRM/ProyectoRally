// Almacenamiento simple en un archivo JSON (data/db.json).
// Suficiente para el prototipo; se puede cambiar por MongoDB más adelante
// sin tocar las rutas, porque todo pasa por estas funciones.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const seed = require('../data/seed');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'db.json');

let db = null;

function load() {
  if (db) return db;
  if (fs.existsSync(DB_PATH)) {
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } else {
    db = JSON.parse(JSON.stringify(seed));
    save();
  }
  // Colecciones nuevas en un archivo viejo: se crean con sus datos iniciales
  let cambio = false;
  for (const key of Object.keys(seed)) {
    if (!Array.isArray(db[key])) {
      db[key] = JSON.parse(JSON.stringify(seed[key]));
      cambio = true;
    }
  }
  if (cambio) save();
  return db;
}

function save() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
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
  save();
  return item;
}

function update(collection, id, data) {
  const items = list(collection);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...data, id };
  save();
  return items[index];
}

function remove(collection, id) {
  const items = list(collection);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  save();
  return true;
}

function reset() {
  db = JSON.parse(JSON.stringify(seed));
  save();
}

module.exports = { list, get, insert, update, remove, reset };
