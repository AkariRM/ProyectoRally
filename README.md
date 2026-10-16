# Bio Red — Píldoras bióticas con poda urbana 🌱

Esferas de arcilla, compost y fibra de poda urbana (principalmente **Ficus benjamina**) con una semilla nativa al centro, para reforestar las **laderas quemadas** de **Jiquilpan y Sahuayo** sin necesidad de riego.

**Economía circular urbana:** la poda que hoy se tira o se vuelve combustible en los cerros durante el estiaje se convierte en eco-pellets de reforestación. Participan el ayuntamiento (recolección), estudiantes (procesamiento y diseño espacial) y brigadas comunitarias (dispersión y siembra).

Proyecto multidisciplinario: **Ingeniería en Sistemas Computacionales**, **Ingeniería Bioquímica** y **Arquitectura**.

---

## Estructura

```
ProyectoRally/
├── backend/            → API REST (Node.js + Express, datos en JSON)
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/     → un archivo por recurso
│   │   ├── lib/        → almacenamiento (db.js) y fábrica CRUD con validación
│   │   └── data/seed.js→ especies nativas y puntos de acopio iniciales
│   └── tests/
└── mobile/             → App móvil (Expo + Expo Router, TypeScript)
    └── src/
        ├── app/        → pantallas (cada archivo es una ruta)
        ├── components/
        └── lib/        → cliente de la API, tipos, usuario
```

---

## Backend

Requisitos: Node.js 20+.

```bash
cd backend
cp .env.example .env
npm install
npm run dev        # http://localhost:3000
npm test           # pruebas de la API
```

Los datos se guardan en:

- **PostgreSQL (Supabase)** si existe `DATABASE_URL` (producción en Render). Tabla `public.documentos` (RLS activado y sin permisos para la API pública de Supabase): al arrancar se carga todo en memoria y cada cambio se guarda de inmediato. Las colecciones y datos iniciales se crean solos la primera vez.
- **`backend/data/db.json`** si no hay `DATABASE_URL` (desarrollo y pruebas; se crea solo, no se sube a git).

Usa una sola instancia del servidor por base de datos: no conectes tu PC y Render a la misma base al mismo tiempo.
`npm run migrar` sube el contenido de `data/db.json` a la base de `DATABASE_URL` (**reemplaza** lo que haya allá).
`POST /api/admin/reset` (solo admin) borra todo y regresa a los datos iniciales.

### Cuentas y administrador

- **Toda la app y la API requieren sesión.** Solo registrarse e iniciar sesión son públicos.
- Los usuarios se registran solo con **correo y clave** (mínimo 6 caracteres).
- La **cuenta de administrador** se define en `backend/.env` con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Al arrancar el servidor se crea esa cuenta; si ya existe, se le restablece la clave.
- Cambia también `AUTH_SECRET` por un texto largo y aleatorio: se usa para firmar las sesiones.
- Un admin puede hacer admin a otros usuarios desde la app (**Inicio → Administrar usuarios**).

| Acción | Voluntario | Municipio | Brigadista | Admin |
|---|---|---|---|---|
| Ver datos; registrar entregas, solicitudes, dispersiones, lotes, ensayos, procesos, seguimientos | ✅ | ✅ | ✅ | ✅ |
| Apuntarse a jornadas de poda e inscribirse a jornadas de reforestación | ✅ | ✅ | ✅ | ✅ |
| Crear/editar zonas de poda, generar jornadas de poda, cancelarlas | — | ✅ | — | ✅ |
| Crear/editar áreas a reforestar; convocar, pasar lista y cerrar jornadas de reforestación | — | — | ✅ | ✅ |
| Exportar datos (CSV / GeoJSON) | — | ✅ | ✅ | ✅ |
| Puntos de acopio, catálogos (especies, tratamientos, pruebas, aditivos, tipos de material), eliminar registros, usuarios y roles | — | — | — | ✅ |

Sin sesión no se puede ver nada.

Un punto de acopio con entregas registradas, o que es destino de alguna zona, no se puede eliminar; en ese caso se edita.

### Endpoints

| Recurso | Ruta | Descripción |
|---|---|---|
| Especies | `/api/especies` | Catálogo de especies nativas |
| Puntos de acopio | `/api/puntos-acopio` | Dónde se recibe la poda de ficus |
| Entregas de poda | `/api/entregas-poda` | Kg de poda fresca recibidos por punto |
| Zonas de poda | `/api/zonas-poda`, `POST /:id/generar-jornadas` | Dónde se poda ficus, días/horario y punto destino |
| Jornadas | `/api/jornadas/proximas`, `POST /:id/apuntarme`, `PUT /:id/estado` | Poda en fecha concreta; al marcarla recolectada crea la entrega en el punto destino |
| Solicitudes | `/api/solicitudes`, `PUT /:id/estado` | Recolección a domicilio con GPS: pendiente → asignada → recolectada |
| Biomasa | `/api/procesos-biomasa`, `/api/procesos-biomasa/inventario` | Secado y triturado; inventario fresca → seca → triturada → usada, kg por tipo de material |
| Áreas a reforestar | `/api/areas-reforestacion` | Laderas quemadas/degradadas: círculo o polígono, riesgo, estado, hectáreas, especies recomendadas |
| Jornadas de reforestación | `/api/jornadas-reforestacion/proximas`, `POST /:id/inscribirme`, `GET /:id/inscritos`, `PUT /:id/cerrar` | Convocatoria con cupo; al cerrarla registra asistencia y la dispersión |
| Exportar | `/api/exportar`, `/api/exportar/<recurso>.csv` o `.geojson` | CSV para Excel, GeoJSON para QGIS (admin, municipio, brigadista) |
| Ruta | `/api/ruta?lat=&lng=&puntoId=` | Ruta sugerida de recolección por cercanía + enlace a Google Maps |
| Catálogos | `/api/catalogos` | Tipos de material, aditivos, tratamientos, pruebas, riesgos, estados, roles |
| Catálogos editables | `/api/tratamientos`, `/api/pruebas`, `/api/aditivos`, `/api/tipos-material`, `/api/especies` | Solo admin crea, edita o elimina; no se elimina lo que está en uso |
| Lotes | `/api/lotes` | Producción: especie, cantidad, mezcla y kg de ficus usado (se descuenta del inventario) |
| Dispersiones | `/api/dispersiones` | Dónde (GPS) y cuántas píldoras se lanzaron |
| Seguimientos | `/api/seguimientos?dispersionId=` | Plántulas germinadas y vivas por revisión |
| Ensayos | `/api/ensayos`, `/api/ensayos/catalogo` | Mediciones de laboratorio por tratamiento |
| Usuarios | `/api/usuarios/registro`, `/login`, `/yo`; admin: `GET /`, `PUT /:id/rol`, `DELETE /:id` | Correo y clave; token `Authorization: Bearer <token>` |
| Estadísticas | `/api/stats` | Totales, por especie, por zona y promedios de ensayos |

Todos los recursos CRUD aceptan `GET /`, `GET /:id`, `POST /`, `PUT /:id` y `DELETE /:id`.

---

## App móvil

```bash
cd mobile
npm install
npx expo start
```

Escanea el código QR con **Expo Go** (Android/iOS). El celular y la computadora deben estar en la **misma red Wi-Fi**; la app busca el backend en la IP de la computadora, puerto 3000.
Para otra URL, crea `mobile/.env` con `EXPO_PUBLIC_API_URL=http://<ip>:3000/api`.

| Pantalla | Qué hace |
|---|---|
| **Login** | Pantalla propia para entrar o crear cuenta (correo y clave); al entrar lleva al dashboard |
| **Inicio (dashboard)** | Avance del proyecto; admin: administrar usuarios y catálogos |
| **Catálogos** (admin) | Agregar, editar y eliminar especies, tratamientos, pruebas, aditivos y tipos de material |
| **Acopio → Zonas de poda** | Mapa de zonas, días y horario de poda, jornadas próximas, "Me apunto", registrar kg recolectados y punto destino, **avisos en el celular** |
| **Acopio → Solicitudes** | Pedir recolección de poda con GPS; voluntarios la toman, abren la ruta y la cierran con los kg reales |
| **Acopio → Puntos** | Puntos de acopio y entregas de poda fresca; admin: agregar, editar y eliminar puntos |
| **Acopio → Biomasa** | Inventario fresca → seca → triturada → en lotes; registrar secado y triturado |
| **Reforestar → Áreas** | Mapa de laderas quemadas por estado (🔥 quemada, 🟠 degradada, 🌱 en reforestación, 🌳 recuperada) con avance de cada una |
| **Reforestar → Jornadas** | Jornadas de reforestación masiva: inscribirse (con cupo y avisos), pasar lista, registrar píldoras sembradas |
| **Reforestar → Dispersiones** | Registrar dispersiones ligadas a un área; abrir su seguimiento |
| **Seguimiento** | Plántulas germinadas, vivas y **altura promedio** a las 2, 4 y 8 semanas |
| **Laboratorio** | Lotes (mezcla y **aditivos biológicos**) y ensayos con calculadora por pesadas |
| **Impacto** | Biomasa recuperada por tipo, reforestación, avance por área y especie; **exportar** a QGIS/Excel |

---

## Avisos de poda

Los avisos son **notificaciones locales** (las programa el propio celular, no se necesita servidor de push y funcionan en Expo Go). En **Acopio → Zonas de poda** toca **🔔 Avisarme** en una zona: llegará un aviso **el día anterior a las 19:00** y **1 hora antes** de cada jornada programada de esa zona.

Las jornadas se crean con **Generar jornadas** (según los días de poda de la zona, 4 semanas) o como **jornada puntual**. Los horarios de las zonas incluidas son **de ejemplo**: hay que pedir los reales a Servicios Públicos de Jiquilpan y Sahuayo.

## Ensayos (sin sensores)

Todo se mide con báscula de cocina (0.1 g), regla, vaso y cronómetro. Se comparan 3 tratamientos:

- **A** – arcilla
- **B** – arcilla + compost
- **C** – arcilla + compost + ficus

| Prueba | Cómo | Unidad |
|---|---|---|
| Retención de agua | (peso mojado − seco) / seco × 100 | % |
| Pérdida de agua 24 h | agua perdida en 24 h a la sombra / agua absorbida × 100 | % |
| Germinación | germinadas / sembradas × 100 | % |
| Grietas al secar | conteo visual | num |
| Resistencia a caída | caídas desde 1 m sin romperse | num |
| Desintegración en agua | minutos hasta deshacerse | min |
| Tiempo de secado | horas hasta peso constante | h |
| Protección térmica | temperatura afuera − adentro de la píldora al sol (termómetro de cocina) | °C |

Los tratamientos y las pruebas se pueden editar desde **Inicio → Catálogos** (admin). Un cuarto tratamiento, **D – C + aditivo biológico** (micorrizas, bacterias fijadoras de N, lombricomposta…), evalúa los aditivos.

---

## Rol de cada carrera

| Carrera | Área |
|---|---|
| **Bioquímica** | Matriz orgánica (celulosa y lignina de la poda), retención de humedad y protección térmica, aditivos biológicos; registra lotes y ensayos en la app |
| **Arquitectura** | Análisis espacial en QGIS (zonas de poda y laderas en riesgo), centro de acopio y procesamiento, plan de dispersión; registra áreas y exporta GeoJSON |
| **Sistemas** | Logística de recolección (zonas, jornadas, solicitudes, rutas), monitoreo de reforestación (áreas, dispersiones, seguimiento), gestión de actores (roles, jornadas, avisos) |

---

## Pendiente

- [ ] Validar el catálogo de especies nativas (Bioquímica)
- [ ] Coordenadas reales de los puntos de acopio y zonas de poda
- [ ] Horarios reales de poda (Servicios Públicos)
- [ ] Modo sin conexión para registrar en campo sin señal
- [x] Backend en Render con PostgreSQL (Supabase); app web en Netlify
