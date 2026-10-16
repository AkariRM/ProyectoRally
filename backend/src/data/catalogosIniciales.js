// Catálogos editables desde la app (pantalla Catálogos, solo admin).
// Los ids se conservan iguales a los valores que usaban versiones anteriores.

module.exports = {
  // Tratamientos (mezclas) que se comparan en los ensayos de laboratorio
  tratamientos: [
    { id: 'A-arcilla', nombre: 'A – Arcilla', descripcion: 'Solo arcilla (control)' },
    { id: 'B-arcilla+compost', nombre: 'B – Arcilla + compost', descripcion: '70 % arcilla, 30 % compost' },
    { id: 'C-arcilla+compost+ficus', nombre: 'C – Arcilla + compost + ficus', descripcion: 'Con fibra de ficus (10–30 %)' },
    { id: 'D-C+aditivo biológico', nombre: 'D – C + aditivo biológico', descripcion: 'Mezcla C con micorrizas, bacterias u otro aditivo' },
    { id: 'otro', nombre: 'Otro', descripcion: 'Describir en notas' },
  ],

  // Pruebas de laboratorio. "calculada" indica que la app pide pesadas o conteos y calcula el resultado.
  pruebas: [
    {
      id: 'retencionAgua', nombre: 'Retención de agua', unidad: '%', calculada: true,
      instrucciones: 'Pesa la píldora seca, sumérgela 10 min, escúrrela 1 min y vuelve a pesar.',
    },
    {
      id: 'perdidaAgua24h', nombre: 'Pérdida de agua 24 h', unidad: '%', calculada: true,
      instrucciones: 'Pesa la píldora seca, luego mojada, y otra vez tras 24 h a la sombra.',
    },
    {
      id: 'germinacion', nombre: 'Germinación', unidad: '%', calculada: true,
      instrucciones: 'Siembra las píldoras en charola y cuenta cuántas semillas germinaron a los 15 días.',
    },
    { id: 'grietas', nombre: 'Grietas al secar', unidad: 'num', instrucciones: 'Cuenta las grietas visibles en la píldora ya seca.' },
    {
      id: 'caida', nombre: 'Resistencia a caída', unidad: 'num',
      instrucciones: 'Deja caer la píldora desde 1 m sobre piso duro; anota cuántas caídas resiste sin romperse.',
    },
    {
      id: 'desintegracion', nombre: 'Desintegración en agua', unidad: 'min',
      instrucciones: 'Pon la píldora en un vaso con agua y mide los minutos hasta que se deshace.',
    },
    { id: 'secado', nombre: 'Tiempo de secado', unidad: 'h', instrucciones: 'Pesa cada 12 h; anota las horas hasta que el peso ya no cambia.' },
    {
      id: 'proteccionTermica', nombre: 'Protección térmica', unidad: '°C',
      instrucciones: 'Al sol del mediodía, mide con termómetro de cocina la temperatura del suelo junto a la píldora y dentro de ella. Anota la diferencia: afuera − adentro.',
    },
  ],

  // Aditivos biológicos para el recubrimiento
  aditivos: [
    { id: 'micorrizas', nombre: 'Micorrizas' },
    { id: 'bacterias fijadoras de N', nombre: 'Bacterias fijadoras de N' },
    { id: 'lombricomposta', nombre: 'Lombricomposta' },
    { id: 'composta extra', nombre: 'Composta extra' },
    { id: 'otro', nombre: 'Otro' },
  ],

  // Tipo de material de poda recolectado
  tiposMaterial: [
    { id: 'hojas', nombre: 'Hojas' },
    { id: 'ramas finas', nombre: 'Ramas finas' },
    { id: 'ramas gruesas', nombre: 'Ramas gruesas' },
    { id: 'pasto', nombre: 'Pasto' },
    { id: 'mixto', nombre: 'Mixto' },
  ],

  // Ingredientes de la mezcla. "recurso" indica de qué inventario de biomasa se descuenta
  // (triturada = escamas de ficus, biochar, harina) y "fracciones" su composición en base
  // seca (0–1) para el balance de masa. Valores tomados del documento de la problemática.
  ingredientes: [
    {
      id: 'biochar-ramas-ficus', nombre: 'Biochar de ramas de ficus', recurso: 'biochar',
      fracciones: { celulosa: 0, hemicelulosa: 0, lignina: 0.15, polifenoles: 0.03, poliisoprenoides: 0 },
      notas: 'Pirólisis > 450 °C sin oxígeno: celulosa, hemicelulosa y terpenos se volatilizan; queda carbono fijo (fracción lignínica ≈ 0.15).',
    },
    {
      id: 'harina-pasto-hojas', nombre: 'Harina de pasto y hojas', recurso: 'harina',
      fracciones: { celulosa: 0.35, hemicelulosa: 0.30, lignina: 0.15, polifenoles: 0.03 },
      notas: 'Biomasa lignocelulósica foliar molida. Fracciones deducidas de los totales del documento (15.75 g celulosa, 13.5 g hemicelulosa/pectinas, 6.75 g lignina, 1.35 g polifenoles por 45 g).',
    },
    {
      id: 'compost-hojas', nombre: 'Compost de hojas', recurso: null,
      fracciones: { celulosa: 0.10, hemicelulosa: 0.15, lignina: 0.35, polifenoles: 0.10 },
      notas: 'Materia orgánica humificada (celulosa lábil 0.10, lignina y ácidos húmicos 0.35, polisacáridos refractarios 0.15, taninos 0.10).',
    },
    {
      id: 'escamas-ficus', nombre: 'Escamas de ficus (hoja triturada 2–3 mm)', recurso: 'triturada',
      fracciones: { celulosa: 0.385, hemicelulosa: 0.305, lignina: 0.234, extractivos: 0.029, cenizas: 0.045 },
      notas: 'Hojas secas y ramillas tiernas secadas al sol y trituradas a 2–3 mm. Composición de hoja/fibra cruda en base seca.',
    },
    {
      id: 'pasta-aglutinante', nombre: 'Pasta aglutinante húmeda', recurso: null, fracciones: {},
      notas: 'Composición por definir (Bioquímica). No aporta al balance de masa hasta que se registren sus fracciones.',
    },
    { id: 'arcilla-local', nombre: 'Arcilla local (Jiquilpan)', recurso: null, fracciones: {}, notas: 'Aporte mineral; sin fracciones lignocelulósicas.' },
    { id: 'humus', nombre: 'Humus / composta madura', recurso: null, fracciones: { lignina: 0.30, hemicelulosa: 0.10, celulosa: 0.08 }, notas: 'Valores aproximados, por validar.' },
  ],

  // Fórmulas de mezcla (porcentajes en masa). Al crear un lote se eligen y se escalan a la masa deseada.
  formulas: [
    {
      id: 'formula-base-150g', nombre: 'Fórmula base del documento (150 g)', masaTotalG: 150,
      ingredientes: [
        { ingredienteId: 'biochar-ramas-ficus', porcentaje: 35 },
        { ingredienteId: 'harina-pasto-hojas', porcentaje: 30 },
        { ingredienteId: 'compost-hojas', porcentaje: 15 },
        { ingredienteId: 'pasta-aglutinante', porcentaje: 20 },
      ],
      notas: '52.5 g biochar + 45 g harina + 22.5 g compost + 30 g pasta aglutinante = 150 g. (El documento indica 55 % / 30 % / 15 %, que no coincide con los gramos.)',
    },
    {
      id: 'formula-arcilla-ficus', nombre: 'Bola de arcilla con escamas de ficus', masaTotalG: 1000,
      ingredientes: [
        { ingredienteId: 'arcilla-local', porcentaje: 50 },
        { ingredienteId: 'compost-hojas', porcentaje: 30 },
        { ingredienteId: 'escamas-ficus', porcentaje: 20 },
      ],
      notas: 'Concepto clásico de bola de arcilla con fibra de ficus como malla interna.',
    },
  ],
};
