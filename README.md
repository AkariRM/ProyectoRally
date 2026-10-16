# ProyectoRally 🌿

**Reutilización de Aceite Doméstico** — Reto 07

Proyecto desarrollado por un equipo multidisciplinario de Sistemas, Arquitectura y Bioquímica.

---

## Estructura del Proyecto

```
ProyectoRally/
├── backend/          → API REST en Node.js + Express
│   └── src/
│       ├── index.js
│       ├── routes/
│       ├── controllers/
│       ├── models/
│       └── middleware/
└── mobile/           → App móvil en React Native (TypeScript)
    └── src/
        ├── screens/
        ├── navigation/
        ├── context/
        ├── services/
        ├── hooks/
        └── utils/
```

---

## Requisitos

- Node.js 18+
- npm 9+
- React Native CLI
- Android Studio o Xcode (para el emulador)

---

## Cómo correr el backend

```bash
cd backend
cp .env.example .env        # configura tus variables de entorno
npm install
npm run dev                  # servidor en http://localhost:3000
```

### Endpoints disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Estado de la API |
| GET | `/api/puntos-acopio` | Listar puntos de acopio |
| POST | `/api/puntos-acopio` | Crear punto de acopio |
| GET | `/api/reportes` | Listar reportes |
| POST | `/api/reportes` | Crear reporte de entrega |
| GET | `/api/reportes/stats` | Estadísticas globales |
| POST | `/api/usuarios/registro` | Registrar usuario |
| POST | `/api/usuarios/login` | Iniciar sesión |

---

## Cómo correr la app móvil

```bash
cd mobile
npm install
npx react-native start         # Metro bundler
npx react-native run-android   # en Android
npx react-native run-ios       # en iOS
```

---

## Pantallas de la app

| Pantalla | Descripción |
|----------|-------------|
| **Inicio** | Panel con estadísticas personales y accesos rápidos |
| **Mapa** | Lista de puntos de acopio (+ mapa cuando esté configurado) |
| **Reportar** | Formulario para registrar una entrega de aceite |
| **Estadísticas** | Impacto individual y comunitario |
| **Perfil** | Puntos, nivel e insignias del usuario |

---

## Rol de cada carrera

| Carrera | Área en el proyecto |
|---------|---------------------|
| **Bioquímica** | Proceso de filtrado y conversión (biodiésel / jabón), criterios de calidad |
| **Arquitectura** | Diseño de eco-estaciones físicas, mapa de ubicación, centro de procesamiento |
| **Sistemas** | App móvil, API REST, mapa interactivo, gamificación (puntos) |

---

## Impacto

> 1 litro de aceite doméstico contamina **40,000 litros de agua**.
> Con este proyecto, cada litro recolectado se convierte en una acción medible.

---

## Próximos pasos

- [ ] Integrar MongoDB para persistencia de datos
- [ ] Configurar `react-native-maps` con puntos reales
- [ ] Añadir autenticación JWT
- [ ] Módulo de biodiésel: cálculo de rendimiento por lote
- [ ] Panel web para administradores de eco-estaciones
