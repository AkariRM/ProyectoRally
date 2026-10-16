# Píldoras Bióticas con Ficus benjamina 🌱

Esferas de arcilla, compost y fibra de **Ficus benjamina** (residuo de poda urbana) con una semilla nativa al centro, para reforestar campos de **Jiquilpan y Sahuayo** sin necesidad de riego.

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

Los datos se guardan en `backend/data/db.json` (se crea solo, no se sube a git).
`POST /api/admin/reset` (solo admin) borra todo y regresa a los datos iniciales.

### Cuentas y administrador

- **Toda la app y la API requieren sesión.** Solo registrarse e iniciar sesión son públicos.
- Los usuarios se registran solo con **correo y clave** (mínimo 6 caracteres).
- La **cuenta de administrador** se define en `backend/.env` con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Al arrancar el servidor se crea esa cuenta; si ya existe, se le restablece la clave.
- Cambia también `AUTH_SECRET` por un texto largo y aleatorio: se usa para firmar las sesiones.
- Un admin puede hacer admin a otros usuarios desde la app (**Inicio → Administrar usuarios**).

| Acción | Sin sesión | Voluntario | Admin |
|---|---|---|---|
| Ver datos | — | ✅ | ✅ |
| Registrar entregas, solicitudes, dispersiones, lotes, ensayos, procesos | — | ✅ | ✅ |
| Apuntarse y registrar recolección de jornadas | — | ✅ | ✅ |
| Agregar / editar / eliminar puntos de acopio, zonas, jornadas y especies | — | — | ✅ |
| Editar o eliminar cualquier registro, administrar usuarios | — | — | ✅ |

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
| Biomasa | `/api/procesos-biomasa`, `/api/procesos-biomasa/inventario` | Secado y triturado; inventario fresca → seca → triturada → usada |
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
| **Inicio (dashboard)** | Avance del proyecto; admin: administrar usuarios |
| **Acopio → Zonas de poda** | Mapa de zonas, días y horario de poda, jornadas próximas, "Me apunto", registrar kg recolectados y punto destino, **avisos en el celular** |
| **Acopio → Solicitudes** | Pedir recolección de poda con GPS; voluntarios la toman, abren la ruta y la cierran con los kg reales |
| **Acopio → Puntos** | Puntos de acopio y entregas de poda fresca; admin: agregar, editar y eliminar puntos |
| **Acopio → Biomasa** | Inventario fresca → seca → triturada → en lotes; registrar secado y triturado |
| **Dispersar** | Registrar dispersión con GPS, lote/especie y cantidad; abrir seguimiento |
| **Seguimiento** | Contar plántulas germinadas y vivas a las 2, 4 y 8 semanas |
| **Laboratorio** | Crear lotes (mezcla) y capturar ensayos con calculadora por pesadas |
| **Impacto** | Estadísticas comunitarias por especie y zona |

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

---

## Rol de cada carrera

| Carrera | Área |
|---|---|
| **Bioquímica** | Caracterización de ficus, arcilla y compost; pruebas de alelopatía; formulación de la mezcla; viabilidad de semillas |
| **Arquitectura** | Taller de producción y secadero, moldes, puntos de acopio, plan de reforestación, imagen del proyecto |
| **Sistemas** | App móvil, API, mapas, registro de datos y estadísticas |

---

## Pendiente

- [ ] Validar el catálogo de especies nativas (Bioquímica)
- [ ] Coordenadas reales de los puntos de acopio y zonas de poda
- [ ] Horarios reales de poda (Servicios Públicos)
- [ ] Modo sin conexión para registrar en campo sin señal
- [ ] Publicar el backend en un servidor para usarlo fuera de la red local
