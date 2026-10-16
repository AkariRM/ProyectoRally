// Datos iniciales. Se copian a data/db.json la primera vez que arranca el servidor
// (o al llamar POST /api/admin/reset).
//
// OJO: las especies son una propuesta inicial de especies nativas de la región
// Ciénega de Chapala; Bioquímica debe validarlas (viabilidad, tratamiento
// pregerminativo, temporada) antes de usarlas en campo.
// Las coordenadas de los puntos de acopio son aproximadas.

module.exports = {
  usuarios: [],

  especies: [
    {
      id: 'mezquite',
      nombreComun: 'Mezquite',
      nombreCientifico: 'Prosopis laevigata',
      tipo: 'árbol',
      temporadaSiembra: 'Junio–julio (inicio de lluvias)',
      tratamientoPregerminativo: 'Escarificación (lija) o remojo en agua caliente',
      validada: false,
    },
    {
      id: 'huizache',
      nombreComun: 'Huizache',
      nombreCientifico: 'Vachellia farnesiana',
      tipo: 'arbusto/árbol',
      temporadaSiembra: 'Junio–julio (inicio de lluvias)',
      tratamientoPregerminativo: 'Escarificación o remojo en agua caliente',
      validada: false,
    },
    {
      id: 'tepame',
      nombreComun: 'Tepame',
      nombreCientifico: 'Vachellia pennatula',
      tipo: 'árbol',
      temporadaSiembra: 'Junio–julio (inicio de lluvias)',
      tratamientoPregerminativo: 'Escarificación',
      validada: false,
    },
    {
      id: 'palo-dulce',
      nombreComun: 'Palo dulce',
      nombreCientifico: 'Eysenhardtia polystachya',
      tipo: 'arbusto/árbol',
      temporadaSiembra: 'Junio–julio (inicio de lluvias)',
      tratamientoPregerminativo: 'Remojo 24 h',
      validada: false,
    },
    {
      id: 'guamuchil',
      nombreComun: 'Guamúchil',
      nombreCientifico: 'Pithecellobium dulce',
      tipo: 'árbol',
      temporadaSiembra: 'Junio–julio (inicio de lluvias)',
      tratamientoPregerminativo: 'Remojo 12–24 h',
      validada: false,
    },
    {
      id: 'cazahuate',
      nombreComun: 'Cazahuate',
      nombreCientifico: 'Ipomoea murucoides',
      tipo: 'árbol',
      temporadaSiembra: 'Junio–julio (inicio de lluvias)',
      tratamientoPregerminativo: 'Escarificación ligera',
      validada: false,
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
  // OJO: los horarios son DE EJEMPLO; reemplazarlos con los de Servicios Públicos.
  zonasPoda: [
    {
      id: 'zona-bosque-cuauhtemoc',
      nombre: 'Bosque Cuauhtémoc',
      municipio: 'Jiquilpan',
      tipo: 'parque',
      lat: 19.9945,
      lng: -102.7135,
      radioM: 250,
      responsable: 'Servicios Públicos Municipales (por confirmar)',
      puntoDestinoId: 'bosque-cuauhtemoc',
      diasSemana: [2, 4],
      horaInicio: '08:00',
      horaFin: '12:00',
      notas: 'Ubicación aproximada y horario de ejemplo',
    },
    // Zonas de Jiquilpan definidas por el equipo. Solo la Plaza de la Aguadora y la
    // Unidad Deportiva tienen coordenadas de OpenStreetMap; las demás están en el
    // centro de Jiquilpan hasta que un admin las corrija (editar zona → usar mi ubicación).
    {
      id: 'zona-andador-jardin-paz',
      nombre: 'Andador del Jardín de la Paz',
      municipio: 'Jiquilpan',
      tipo: 'calle',
      lat: 19.9902,
      lng: -102.7192,
      radioM: 150,
      responsable: 'Servicios Públicos Municipales (por confirmar)',
      puntoDestinoId: 'plaza-jiquilpan',
      diasSemana: [],
      notas: 'Ubicación y horario por confirmar',
    },
    {
      id: 'zona-jardin-paz',
      nombre: 'Jardín de la Paz',
      municipio: 'Jiquilpan',
      tipo: 'plaza',
      lat: 19.9902,
      lng: -102.7192,
      radioM: 100,
      responsable: 'Servicios Públicos Municipales (por confirmar)',
      puntoDestinoId: 'plaza-jiquilpan',
      diasSemana: [],
      notas: 'Ubicación y horario por confirmar',
    },
    {
      id: 'zona-plaza-aguadora',
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
    {
      id: 'zona-parque-lineal',
      nombre: 'Parque Lineal',
      municipio: 'Jiquilpan',
      tipo: 'parque',
      lat: 19.9902,
      lng: -102.7192,
      radioM: 300,
      responsable: 'Servicios Públicos Municipales (por confirmar)',
      puntoDestinoId: 'bosque-cuauhtemoc',
      diasSemana: [],
      notas: 'Ubicación y horario por confirmar',
    },
    {
      id: 'zona-escuelas-jiquilpan',
      nombre: 'Escuelas de Jiquilpan',
      municipio: 'Jiquilpan',
      tipo: 'escuela',
      lat: 19.9902,
      lng: -102.7192,
      radioM: 500,
      responsable: 'Cada escuela (por confirmar)',
      puntoDestinoId: 'plaza-jiquilpan',
      diasSemana: [],
      notas: 'Zona general: conviene crear una zona por cada escuela participante',
    },
    {
      id: 'zona-centro-sahuayo',
      nombre: 'Centro de Sahuayo',
      municipio: 'Sahuayo',
      tipo: 'plaza',
      lat: 20.0577,
      lng: -102.724,
      radioM: 300,
      responsable: 'Servicios Públicos Municipales (por confirmar)',
      puntoDestinoId: 'plaza-sahuayo',
      diasSemana: [3],
      horaInicio: '07:00',
      horaFin: '11:00',
      notas: 'Horario de ejemplo',
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

  // Lotes de producción de píldoras
  lotes: [],

  // Lugares donde se lanzaron píldoras
  dispersiones: [],

  // Revisiones posteriores de una dispersión (germinación / supervivencia)
  seguimientos: [],

  // Mediciones de laboratorio (Bioquímica / Arquitectura)
  ensayos: [],
};
