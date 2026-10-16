export type Municipio = 'Jiquilpan' | 'Sahuayo' | 'Otro';
export type Rol = 'admin' | 'municipio' | 'brigadista' | 'voluntario';
export type TipoMaterial = string; // id del catálogo de tipos de material

export interface Usuario {
  id: string;
  email: string;
  rol: Rol;
  creadoEn?: string;
}

export interface Sesion {
  usuario: Usuario;
  token: string;
}

export interface Especie {
  id: string;
  nombreComun: string;
  nombreCientifico: string;
  tipo?: string;
  temporadaSiembra?: string;
  tratamientoPregerminativo?: string;
  validada?: boolean;
  notas?: string;
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
  tipoMaterial?: TipoMaterial;
  especieArbol?: string;
  usuarioId?: string;
  notas?: string;
  creadoEn: string;
}

export interface IngredienteLote {
  ingredienteId: string;
  gramos: number;
}

export interface Composicion {
  masaTotalG: number;
  componentes: Record<string, { gramos: number; porcentaje: number }>;
}

export interface Lote {
  id: string;
  codigo: string;
  especieId: string;
  formulaId?: string;
  ingredientes?: IngredienteLote[];
  cantidad: number;
  pesoPildoraG?: number;
  diametroMm?: number;
  semillasPorPildora: number;
  composicion?: Composicion;
  consumo?: Record<string, number>; // kg tomados de cada inventario
  aditivos?: string[];
  aditivosDetalle?: string;
  advertencia?: string;
  usuarioId?: string;
  notas?: string;
  creadoEn: string;
  // Lotes anteriores (mezcla en %)
  arcillaPct?: number;
  compostPct?: number;
  ficusPct?: number;
  kgFicus?: number;
}

export interface Dispersion {
  id: string;
  lat: number;
  lng: number;
  zona: string;
  areaId?: string;
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
  alturaPromedioCm?: number;
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
  alturaPromedioCm: number | null;
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
  porArea: (ResumenDispersion & { areaId: string; area: string; estado: EstadoArea | null })[];
  reforestacion: { areas: number; hectareas: number; jornadasRealizadas: number; jornadasProximas: number; participantes: number };
  ensayos: { tratamiento: string; prueba: string; unidad: string; n: number; promedio: number | null }[];
}

export type TipoProceso = 'secado' | 'triturado' | 'pirolisis' | 'molienda';
export type Fraccion = 'fina' | 'media' | 'mixta';

export interface ProcesoBiomasa {
  id: string;
  tipo: TipoProceso;
  kgEntrada: number;
  kgSalida: number;
  fraccion?: Fraccion;
  temperaturaC?: number;
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
  biochar: number;
  harina: number;
  recibida: number;
  secaObtenida: number;
  trituradaObtenida: number;
  biocharObtenido: number;
  harinaObtenida: number;
  usada: number;
  usadaPor: Record<string, number>;
  rendimientoPirolisis: number | null;
  rendimientoMolienda: number | null;
  trituradaPorFraccion: Record<string, number>;
  recibidaPorTipo: Record<string, number>;
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
  tipoMaterial?: TipoMaterial;
  especieArbol?: string;
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
  ubicacionConfirmada?: boolean; // false = coordenada provisional
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

export type Riesgo = 'bajo' | 'medio' | 'alto';
export type EstadoArea = 'quemada' | 'degradada' | 'en reforestación' | 'recuperada';

export interface AreaReforestacion {
  id: string;
  nombre: string;
  municipio?: Municipio;
  lat: number;
  lng: number;
  radioM: number;
  poligono?: [number, number][];
  riesgoIncendio: Riesgo;
  estado: EstadoArea;
  fechaIncendio?: string;
  hectareas?: number;
  especiesRecomendadas: string[];
  notas?: string;
  creadoEn: string;
}

export interface JornadaReforestacion {
  id: string;
  titulo: string;
  areaId: string;
  area?: AreaReforestacion | null;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  puntoReunion?: string;
  cupo?: number;
  pildorasMeta?: number;
  organiza?: string;
  descripcion?: string;
  estado: 'programada' | 'realizada' | 'cancelada';
  inscritos: string[];
  asistentes: string[];
  pildorasDispersadas?: number;
  creadoEn: string;
}

// Elemento de un catálogo editable (tratamientos, aditivos, tipos de material)
export interface ItemCatalogo {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Prueba extends ItemCatalogo {
  unidad: string;
  instrucciones?: string;
  calculada?: boolean;
}

export type RecursoBiomasa = 'triturada' | 'biochar' | 'harina';

export interface Ingrediente extends ItemCatalogo {
  recurso?: RecursoBiomasa | null; // inventario del que se descuenta
  fracciones: Record<string, number>; // base seca, 0–1
  notas?: string;
}

export interface Formula extends ItemCatalogo {
  masaTotalG?: number;
  ingredientes: { ingredienteId: string; porcentaje: number }[];
  notas?: string;
}

export interface Catalogos {
  ingredientes: Ingrediente[];
  formulas: Formula[];
  componentes: string[];
  tiposMaterial: ItemCatalogo[];
  aditivos: ItemCatalogo[];
  tratamientos: ItemCatalogo[];
  pruebas: Prueba[];
  riesgos: Riesgo[];
  estadosArea: EstadoArea[];
  roles: Rol[];
}

export interface ParadaRuta {
  tipo: 'solicitud' | 'jornada' | 'acopio';
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  detalle: string;
  km: number;
}
