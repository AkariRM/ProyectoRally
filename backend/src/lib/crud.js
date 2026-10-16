// Fábrica de rutas CRUD con validación sencilla basada en un esquema.
//
// Esquema: { campo: { type: 'string' | 'number' | 'enum' | 'object', required, min, max, values, ref } }
//   - ref: nombre de otra colección; se valida que el id exista.

const express = require('express');
const db = require('./db');

function validate(schema, body, { partial = false } = {}) {
  const errores = [];
  const data = {};

  for (const [campo, regla] of Object.entries(schema)) {
    const valor = body[campo];
    const vacio = valor === undefined || valor === null || valor === '';

    if (vacio) {
      if (regla.required && !partial) errores.push(`${campo} es requerido`);
      continue;
    }

    if (regla.type === 'number') {
      const n = Number(valor);
      if (Number.isNaN(n)) { errores.push(`${campo} debe ser numérico`); continue; }
      if (regla.min !== undefined && n < regla.min) { errores.push(`${campo} debe ser ≥ ${regla.min}`); continue; }
      if (regla.max !== undefined && n > regla.max) { errores.push(`${campo} debe ser ≤ ${regla.max}`); continue; }
      data[campo] = n;
    } else if (regla.type === 'enum') {
      if (!regla.values.includes(valor)) {
        errores.push(`${campo} debe ser uno de: ${regla.values.join(', ')}`);
        continue;
      }
      data[campo] = valor;
    } else if (regla.type === 'object') {
      if (typeof valor !== 'object') { errores.push(`${campo} debe ser un objeto`); continue; }
      data[campo] = valor;
    } else {
      data[campo] = String(valor).trim();
    }

    if (regla.ref && !db.get(regla.ref, data[campo])) {
      errores.push(`${campo}: no existe el registro ${data[campo]} en ${regla.ref}`);
    }
  }

  return { errores, data };
}

function crudRouter(collection, schema, hooks = {}) {
  const router = express.Router();

  router.get('/', (req, res) => {
    let items = db.list(collection);
    // Filtros simples por query: ?especieId=mezquite&loteId=...
    for (const [campo, valor] of Object.entries(req.query)) {
      if (schema[campo]) items = items.filter(item => String(item[campo]) === String(valor));
    }
    res.json({ success: true, data: items });
  });

  router.get('/:id', (req, res) => {
    const item = db.get(collection, req.params.id);
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true, data: item });
  });

  router.post('/', (req, res) => {
    const { errores, data } = validate(schema, req.body);
    if (hooks.validate) errores.push(...hooks.validate(data));
    if (errores.length) return res.status(400).json({ error: errores.join('; '), errores });
    const final = hooks.beforeCreate ? hooks.beforeCreate(data) : data;
    res.status(201).json({ success: true, data: db.insert(collection, final) });
  });

  router.put('/:id', (req, res) => {
    if (!db.get(collection, req.params.id)) return res.status(404).json({ error: 'No encontrado' });
    const { errores, data } = validate(schema, req.body, { partial: true });
    if (errores.length) return res.status(400).json({ error: errores.join('; '), errores });
    res.json({ success: true, data: db.update(collection, req.params.id, data) });
  });

  router.delete('/:id', (req, res) => {
    if (!db.remove(collection, req.params.id)) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  });

  return router;
}

module.exports = { crudRouter, validate };
