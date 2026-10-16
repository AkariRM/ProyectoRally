export type Municipio = 'Jiquilpan' | 'Sahuayo' | 'Otro';
export type Carrera = 'Sistemas' | 'Bioquímica' | 'Arquitectura' | 'Voluntario';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  carrera?: Carrera;
}

export interface Especie {
  id: string;
  nombreComun: string;
  nombreCientifico: string;
  tipo?: string;
  temporadaSiembra?: string;
  tratamientoPregerminativo?: string;
  validada?: boolean;
}

export interface PuntoAcopio {
  id: string;
  nombre: string;
  direccion: string;
  municipio?: Municipio;
  lat?: number;
  lng?: number;
  tipo?: string;
}

export interface EntregaPoda {
  id: string;
  puntoId: string;
  kg: number;
  usuarioId?: string;
  notas?: string;
  creadoEn: string;
}

export interface Lote {
  id: string;
  codigo: string;
  especieId: string;
  cantidad: number;
  arcillaPct: number;
  compostPct: number;
  ficusPct: number;
  semillasPorPildora: number;
  diametroMm?: number;
  pesoPildoraG?: number;
  kgFicus?: number;
  advertencia?: string;
  usuarioId?: string;
  notas?: string;
  creadoEn: string;
}

export interface Dispersion {
  id: string;
  lat: number;
  lng: number;
  zona: string;
  municipio?: Municipio;
  loteId?: string;
  especieId?: string;
  cantidad: number;
  usuarioId?: string;
  notas?: string;
  creadoEn: string;
}

export interface Seguimiento {
  id: string;
  dispersionId: string;
  germinadas: number;
  vivas?: number;
  humedadSuelo?: 'seco' | 'húmedo' | 'encharcado';
  usuarioId?: string;
  notas?: string;
  creadoEn: string;
}

export interface Ensayo {
  id: string;
  tratamiento: string;
  prueba: string;
  valor: number;
  unidad: string;
  repeticion?: number;
  usuarioId?: string;
  loteId?: string;
  notas?: string;
  creadoEn: string;
}

export interface CatalogoEnsayos {
  tratamientos: string[];
  pruebas: Record<string, string>;
}

export interface ResumenDispersion {
  dispersiones: number;
  pildoras: number;
  pildorasRevisadas: number;
  germinadas: number;
  vivas: number;
  tasaGerminacion: number | null;
}

export interface Stats extends ResumenDispersion {
  kgPodaRecibida: number;
  entregasPoda: number;
  lotes: number;
  pildorasProducidas: number;
  voluntarios: number;
  biomasa: InventarioBiomasa;
  solicitudesPendientes: number;
  jornadasProximas: number;
  porEspecie: (ResumenDispersion & { especieId: string; especie: string })[];
  porZona: (ResumenDispersion & { zona: string })[];
  ensayos: { tratamiento: string; prueba: string; unidad: string; n: number; promedio: number | null }[];
}

export type TipoProceso = 'secado' | 'triturado';
export type Fraccion = 'fina' | 'media' | 'mixta';

export interface ProcesoBiomasa {
  id: string;
  tipo: TipoProceso;
  kgEntrada: number;
  kgSalida: number;
  fraccion?: Fraccion;
  metodo?: string;
  dias?: number;
  usuarioId?: string;
  notas?: string;
  creadoEn: string;
}

export interface InventarioBiomasa {
  fresca: number;
  seca: number;
  triturada: number;
  recibida: number;
  secaObtenida: number;
  trituradaObtenida: number;
  usada: number;
  trituradaPorFraccion: Record<string, number>;
  perdidaSecado: number | null;
  rendimientoTriturado: number | null;
}

export type EstadoSolicitud = 'pendiente' | 'asignada' | 'recolectada' | 'cancelada';

export interface Solicitud {
  id: string;
  nombre: string;
  contacto?: string;
  direccion: string;
  municipio?: Municipio;
  lat: number;
  lng: number;
  kgEstimados?: number;
  estado: EstadoSolicitud;
  recolectorId?: string | null;
  puntoId?: string;
  kgReales?: number;
  usuarioId?: string;
  notas?: string;
  creadoEn: string;
}

export interface ZonaPoda {
  id: string;
  nombre: string;
  municipio?: Municipio;
  tipo?: 'calle' | 'plaza' | 'parque' | 'escuela' | 'otro';
  lat: number;
  lng: number;
  radioM: number;
  responsable?: string;
  puntoDestinoId?: string;
  diasSemana: number[];
  horaInicio?: string;
  horaFin?: string;
  notas?: string;
  creadoEn?: string;
}

export interface Jornada {
  id: string;
  zonaId: string;
  zona?: ZonaPoda | null;
  fecha: string; // YYYY-MM-DD
  horaInicio?: string;
  horaFin?: string;
  puntoDestinoId?: string;
  estado: 'programada' | 'recolectada' | 'cancelada';
  voluntarios: string[];
  kgRecolectados?: number;
  notas?: string;
  creadoEn: string;
}
