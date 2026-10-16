// Datos iniciales. Se copian a data/db.json la primera vez que arranca el servidor
// (o al llamar POST /api/admin/reset).
//
// OJO: las especies son una propuesta inicial de especies nativas de la región
// Ciénega de Chapala; Bioquímica debe validarlas (viabilidad, tratamiento
// pregerminativo, temporada) antes de usarlas en campo.
// Las coordenadas de los puntos de acopio son aproximadas.

module.exports = {
  // Tratamientos, pruebas, aditivos y tipos de material (editables por admin)
  ...require('./catalogosIniciales'),

  usuarios: [],

  // Semilla al centro de la esfera: especie nativa resistente (documento:
  // "como mezquite, huizache o agave silvestre")
  especies: [
    {
      id: 'mezquite',
      nombreComun: 'Mezquite',
      nombreCientifico: 'Prosopis laevigata',
      tipo: 'árbol',
      validada: false,
      notas: 'Especie nativa resistente mencionada en el documento',
    },
    {
      id: 'huizache',
      nombreComun: 'Huizache',
      nombreCientifico: 'Vachellia farnesiana',
      tipo: 'arbusto/árbol',
      validada: false,
      notas: 'Especie nativa resistente mencionada en el documento',
    },
    {
      id: 'agave-silvestre',
      nombreComun: 'Agave silvestre',
      nombreCientifico: 'Agave spp.',
      tipo: 'suculenta',
      validada: false,
      notas: 'Especie nativa resistente mencionada en el documento',
    },
  ],

  puntosAcopio: [
    {
      id: 'bosque-cuauhtemoc',
      nombre: 'Bosque Cuauhtémoc',
      direccion: 'Jiquilpan, Mich.',
      municipio: 'Jiquilpan',
      lat: 19.9945,
      lng: -102.7135,
      tipo: 'parque',
    },
    {
      id: 'plaza-jiquilpan',
      nombre: 'Plaza principal de Jiquilpan',
      direccion: 'Centro, Jiquilpan, Mich.',
      municipio: 'Jiquilpan',
      lat: 19.9907,
      lng: -102.7176,
      tipo: 'plaza',
    },
    {
      id: 'plaza-sahuayo',
      nombre: 'Plaza principal de Sahuayo',
      direccion: 'Centro, Sahuayo, Mich.',
      municipio: 'Sahuayo',
      lat: 20.0577,
      lng: -102.7240,
      tipo: 'plaza',
    },
  ],

  // Zonas donde se poda Ficus benjamina. diasSemana: 0 = domingo … 6 = sábado.
  // Coordenadas de OpenStreetMap; los horarios están por confirmar con Servicios Públicos.
  // Las zonas sin ubicación conocida están en docs/zonas-pendientes.txt.
  zonasPoda: [
    {
      id: 'zona-plaza-aguadora',
      ubicacionConfirmada: true,
      nombre: 'Plaza de la Aguadora',
      municipio: 'Jiquilpan',
      tipo: 'plaza',
      lat: 19.99063,
      lng: -102.71896,
      radioM: 80,
      responsable: 'Servicios Públicos Municipales (por confirmar)',
      puntoDestinoId: 'plaza-jiquilpan',
      diasSemana: [],
      notas: 'Horario por confirmar',
    },
    {
      id: 'zona-unidad-deportiva',
      ubicacionConfirmada: true,
      nombre: 'Unidad Deportiva Lázaro Cárdenas',
      municipio: 'Jiquilpan',
      tipo: 'parque',
      lat: 19.98449,
      lng: -102.70429,
      radioM: 200,
      responsable: 'Servicios Públicos Municipales (por confirmar)',
      puntoDestinoId: 'bosque-cuauhtemoc',
      diasSemana: [],
      notas: 'Horario por confirmar',
    },
  ],

  // Jornadas de poda concretas (fecha y hora) de una zona
  jornadas: [],

  // Kg de poda de Ficus benjamina recibidos en un punto de acopio
  entregasPoda: [],

  // Secado y triturado de la poda (fresca → seca → triturada)
  procesosBiomasa: [],

  // Solicitudes de recolección de poda a domicilio
  solicitudes: [],

  // Áreas a reforestar (laderas quemadas o degradadas), definidas por Arquitectura
  areasReforestacion: [],

  // Jornadas de reforestación masiva en un área
  jornadasReforestacion: [],

  // Lotes de producción de píldoras
  lotes: [],

  // Lugares donde se lanzaron píldoras
  dispersiones: [],

  // Revisiones posteriores de una dispersión (germinación / supervivencia)
  seguimientos: [],

  // Mediciones de laboratorio (Bioquímica / Arquitectura)
  ensayos: [],
};
