// Sube el contenido de data/db.json a PostgreSQL (Supabase), REEMPLAZANDO lo que haya allá.
// Uso:  npm run migrar        (lee DATABASE_URL de .env)
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const ARCHIVO = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'db.json');

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en .env');
    process.exit(1);
  }
  if (!fs.existsSync(ARCHIVO)) {
    console.error(`No existe ${ARCHIVO}`);
    process.exit(1);
  }
  const datos = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));
  const db = require('../src/lib/db');
  await db.reemplazarTodo(datos);
  for (const [coleccion, items] of Object.entries(datos)) {
    if (items.length) console.log(`  ${coleccion}: ${items.length}`);
  }
  console.log('✅ Datos migrados a PostgreSQL');
  await db.cerrar();
})().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
