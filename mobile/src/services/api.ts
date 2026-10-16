import axios from 'axios';

const BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api'   // Android emulator → localhost
  : 'https://tu-api-produccion.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor para logging en desarrollo
if (__DEV__) {
  api.interceptors.request.use(config => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });
}

// ── Puntos de acopio ──────────────────────────────────────────────────────────
export const puntosAcopioService = {
  getAll: () => api.get('/puntos-acopio'),
  getOne: (id: string) => api.get(`/puntos-acopio/${id}`),
  create: (data: object) => api.post('/puntos-acopio', data),
  update: (id: string, data: object) => api.put(`/puntos-acopio/${id}`, data),
  remove: (id: string) => api.delete(`/puntos-acopio/${id}`),
};

// ── Reportes ──────────────────────────────────────────────────────────────────
export const reportesService = {
  getAll: () => api.get('/reportes'),
  create: (data: object) => api.post('/reportes', data),
  getStats: () => api.get('/reportes/stats'),
};

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const usuariosService = {
  register: (data: object) => api.post('/usuarios/registro', data),
  login: (data: object) => api.post('/usuarios/login', data),
  getProfile: (id: string) => api.get(`/usuarios/perfil/${id}`),
};

export default api;
