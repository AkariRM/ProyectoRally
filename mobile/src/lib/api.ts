import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type {
  CatalogoEnsayos, Dispersion, EntregaPoda, Ensayo, Especie, EstadoSolicitud, InventarioBiomasa, Lote,
  Jornada, ProcesoBiomasa, PuntoAcopio, Rol, Seguimiento, Sesion, Solicitud, Stats, Usuario, ZonaPoda,
  AreaReforestacion, Catalogos, ItemCatalogo, JornadaReforestacion, ParadaRuta, Prueba,
} from './types';

// URL del backend:
// - Web abierta por un túnel de VS Code (…-8081.xxx.devtunnels.ms): el mismo túnel con -3000.
// - EXPO_PUBLIC_API_URL si está definida (ej. en mobile/.env).
// - Web local: mismo host que la página, puerto 3000.
// - Celular con Expo Go: la IP de la computadora que corre `expo start`, puerto 3000
//   (misma red Wi-Fi).
function resolverBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname.includes('-8081.')) return `${protocol}//${hostname.replace('-8081.', '-3000.')}/api`;
    // En la misma computadora o red local se ignora EXPO_PUBLIC_API_URL
    const local = hostname === 'localhost' || hostname === '127.0.0.1' || /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(hostname);
    if (!local && process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
    return `${protocol}//${hostname}:3000/api`;
  }
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

// URL de descarga de un archivo exportado (el token va en la URL para abrirla en el navegador)
export const urlExportar = (recurso: string, formato: 'csv' | 'geojson') =>
  `${BASE_URL}/exportar/${recurso}.${formato}?token=${encodeURIComponent(token ?? '')}`;

// Catálogos editables por admin: ruta de la API de cada uno
export const RUTA_CATALOGO = {
  tratamientos: '/tratamientos',
  pruebas: '/pruebas',
  aditivos: '/aditivos',
  tiposMaterial: '/tipos-material',
} as const;
export type NombreCatalogo = keyof typeof RUTA_CATALOGO;

export const api = {
  catalogos: () => get<Catalogos>('/catalogos'),
  crearEnCatalogo: (c: NombreCatalogo, data: Partial<Prueba>) => post<ItemCatalogo>(RUTA_CATALOGO[c], data),
  editarEnCatalogo: (c: NombreCatalogo, id: string, data: Partial<Prueba>) =>
    put<ItemCatalogo>(`${RUTA_CATALOGO[c]}/${encodeURIComponent(id)}`, data),
  eliminarDeCatalogo: (c: NombreCatalogo, id: string) => del(`${RUTA_CATALOGO[c]}/${encodeURIComponent(id)}`),

  crearEspecie: (data: Partial<Especie>) => post<Especie>('/especies', data),
  editarEspecie: (id: string, data: Partial<Especie>) => put<Especie>(`/especies/${encodeURIComponent(id)}`, data),
  eliminarEspecie: (id: string) => del(`/especies/${encodeURIComponent(id)}`),

  areas: () => get<AreaReforestacion[]>('/areas-reforestacion'),
  crearArea: (data: Partial<AreaReforestacion>) => post<AreaReforestacion>('/areas-reforestacion', data),
  editarArea: (id: string, data: Partial<AreaReforestacion>) => put<AreaReforestacion>(`/areas-reforestacion/${id}`, data),
  eliminarArea: (id: string) => del(`/areas-reforestacion/${id}`),

  jornadasReforestacion: () => get<JornadaReforestacion[]>('/jornadas-reforestacion'),
  jornadasReforestacionProximas: () => get<JornadaReforestacion[]>('/jornadas-reforestacion/proximas'),
  crearJornadaReforestacion: (data: Partial<JornadaReforestacion>) => post<JornadaReforestacion>('/jornadas-reforestacion', data),
  inscribirme: (id: string, quitar = false) => post<JornadaReforestacion>(`/jornadas-reforestacion/${id}/inscribirme`, { quitar }),
  inscritos: (id: string) => get<{ id: string; email: string }[]>(`/jornadas-reforestacion/${id}/inscritos`),
  cerrarJornadaReforestacion: (
    id: string,
    data: { estado: 'realizada' | 'cancelada'; asistentes?: string[]; pildorasDispersadas?: number; loteId?: string; especieId?: string },
  ) => put<JornadaReforestacion>(`/jornadas-reforestacion/${id}/cerrar`, data),

  ruta: (lat: number, lng: number, puntoId?: string) =>
    get<{ paradas: ParadaRuta[]; totalKm: number; googleMapsUrl: string | null }>(
      `/ruta?lat=${lat}&lng=${lng}${puntoId ? `&puntoId=${encodeURIComponent(puntoId)}` : ''}`,
    ),

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
    data: {
      estado: 'recolectada' | 'cancelada'; kgRecolectados?: number; puntoDestinoId?: string;
      tipoMaterial?: string; especieArbol?: string;
    },
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
