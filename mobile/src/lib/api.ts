import Constants from 'expo-constants';
import type {
  CatalogoEnsayos, Dispersion, EntregaPoda, Ensayo, Especie, EstadoSolicitud, InventarioBiomasa, Lote,
  Jornada, ProcesoBiomasa, PuntoAcopio, Rol, Seguimiento, Sesion, Solicitud, Stats, Usuario, ZonaPoda,
} from './types';

// URL del backend:
// 1. EXPO_PUBLIC_API_URL si está definida (ej. en mobile/.env)
// 2. Si no, la misma IP de la computadora que corre `expo start`, puerto 3000.
//    Así funciona en el celular con Expo Go si está en la misma red Wi-Fi.
function resolverBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:3000/api`;
}

export const BASE_URL = resolverBaseUrl();

// Token de la sesión actual (lo fija UsuarioProvider)
let token: string | null = null;
export const setToken = (t: string | null) => {
  token = t;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`No hay conexión con el servidor (${BASE_URL}). ¿Está corriendo el backend?`);
  }
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(body.error || `Error ${resp.status}`);
  return (body.data ?? body.stats) as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, data: object) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(data) });
const put = <T>(path: string, data: object) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(data) });
const del = (path: string) => request<unknown>(path, { method: 'DELETE' });

export const api = {
  especies: () => get<Especie[]>('/especies'),
  puntosAcopio: () => get<PuntoAcopio[]>('/puntos-acopio'),
  crearPuntoAcopio: (data: Partial<PuntoAcopio>) => post<PuntoAcopio>('/puntos-acopio', data),
  editarPuntoAcopio: (id: string, data: Partial<PuntoAcopio>) => put<PuntoAcopio>(`/puntos-acopio/${id}`, data),
  eliminarPuntoAcopio: (id: string) => del(`/puntos-acopio/${id}`),

  entregasPoda: () => get<EntregaPoda[]>('/entregas-poda'),
  crearEntregaPoda: (data: Partial<EntregaPoda>) => post<EntregaPoda>('/entregas-poda', data),

  inventarioBiomasa: () => get<InventarioBiomasa>('/procesos-biomasa/inventario'),
  procesosBiomasa: () => get<ProcesoBiomasa[]>('/procesos-biomasa'),
  crearProcesoBiomasa: (data: Partial<ProcesoBiomasa>) => post<ProcesoBiomasa>('/procesos-biomasa', data),

  solicitudes: () => get<Solicitud[]>('/solicitudes'),
  crearSolicitud: (data: Partial<Solicitud>) => post<Solicitud>('/solicitudes', data),
  cambiarEstadoSolicitud: (
    id: string,
    data: { estado: EstadoSolicitud; recolectorId?: string; puntoId?: string; kgReales?: number },
  ) => request<Solicitud>(`/solicitudes/${id}/estado`, { method: 'PUT', body: JSON.stringify(data) }),

  zonasPoda: () => get<ZonaPoda[]>('/zonas-poda'),
  crearZonaPoda: (data: Partial<ZonaPoda>) => post<ZonaPoda>('/zonas-poda', data),
  editarZonaPoda: (id: string, data: Partial<ZonaPoda>) => put<ZonaPoda>(`/zonas-poda/${id}`, data),
  eliminarZonaPoda: (id: string) => del(`/zonas-poda/${id}`),
  generarJornadas: (zonaId: string, semanas = 4) =>
    post<Jornada[]>(`/zonas-poda/${zonaId}/generar-jornadas`, { semanas }),

  jornadasProximas: () => get<Jornada[]>('/jornadas/proximas'),
  crearJornada: (data: Partial<Jornada>) => post<Jornada>('/jornadas', data),
  apuntarmeJornada: (id: string, quitar = false) => post<Jornada>(`/jornadas/${id}/apuntarme`, { quitar }),
  cambiarEstadoJornada: (
    id: string,
    data: { estado: 'recolectada' | 'cancelada'; kgRecolectados?: number; puntoDestinoId?: string; usuarioId?: string },
  ) => request<Jornada>(`/jornadas/${id}/estado`, { method: 'PUT', body: JSON.stringify(data) }),

  lotes: () => get<Lote[]>('/lotes'),
  crearLote: (data: Partial<Lote>) => post<Lote>('/lotes', data),

  dispersiones: () => get<Dispersion[]>('/dispersiones'),
  dispersion: (id: string) => get<Dispersion>(`/dispersiones/${id}`),
  crearDispersion: (data: Partial<Dispersion>) => post<Dispersion>('/dispersiones', data),

  seguimientos: (dispersionId: string) =>
    get<Seguimiento[]>(`/seguimientos?dispersionId=${encodeURIComponent(dispersionId)}`),
  crearSeguimiento: (data: Partial<Seguimiento>) => post<Seguimiento>('/seguimientos', data),

  catalogoEnsayos: () => get<CatalogoEnsayos>('/ensayos/catalogo'),
  ensayos: () => get<Ensayo[]>('/ensayos'),
  crearEnsayo: (data: Partial<Ensayo>) => post<Ensayo>('/ensayos', data),

  registrar: (email: string, password: string) => post<Sesion>('/usuarios/registro', { email, password }),
  login: (email: string, password: string) => post<Sesion>('/usuarios/login', { email, password }),
  yo: () => get<Usuario>('/usuarios/yo'),
  usuarios: () => get<Usuario[]>('/usuarios'),
  cambiarRol: (id: string, rol: Rol) => put<Usuario>(`/usuarios/${id}/rol`, { rol }),
  eliminarUsuario: (id: string) => del(`/usuarios/${id}`),

  stats: () => get<Stats>('/stats'),
};
