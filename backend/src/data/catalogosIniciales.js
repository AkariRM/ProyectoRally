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

  // Inóculo local (documento): micorrizas de suelo forestal o bacterias benéficas
  aditivos: [
    { id: 'micorrizas', nombre: 'Micorrizas de suelo forestal' },
    { id: 'bacterias-beneficas', nombre: 'Bacterias benéficas' },
  ],

  // Material de poda recolectado (documento: hojas secas, ramillas tiernas, ramas, pasto)
  tiposMaterial: [
    { id: 'hojas', nombre: 'Hojas secas' },
    { id: 'ramas finas', nombre: 'Ramillas tiernas' },
    { id: 'ramas gruesas', nombre: 'Ramas' },
    { id: 'pasto', nombre: 'Pasto' },
  ],

  // Ingredientes de la mezcla. "recurso" indica de qué inventario de biomasa se descuenta
  // (triturada = escamas de ficus, biochar, harina) y "fracciones" su composición en base
  // seca (0–1) para el balance de masa. Las de biochar, harina y compost son las que usa el
  // documento en su "Integración Cuantitativa" (masa de cada componente / masa del insumo),
  // así la receta de 150 g da sus resultados: celulosa 12 %, lignina 18 %,
  // hemicelulosa/pectinas 11.25 %, polifenoles 3.5 %.
  ingredientes: [
    {
      id: 'biochar-ramas-ficus', nombre: 'Biochar de ramas de ficus', recurso: 'biochar',
      fracciones: { celulosa: 0, hemicelulosa: 0, lignina: 0.235714, polifenoles: 0.031429, poliisoprenoides: 0 },
      notas: 'Pirólisis > 450 °C sin oxígeno: celulosa, hemicelulosa y poliisoprenoides se volatilizan; queda carbono fijo. Documento: 12.375 g de lignina y estructuras equivalentes y 1.65 g de polifenoles por 52.5 g.',
    },
    {
      id: 'harina-pasto-hojas', nombre: 'Harina de pasto y hojas', recurso: 'harina',
      fracciones: { celulosa: 0.35, hemicelulosa: 0.30, lignina: 0.15, polifenoles: 0.03 },
      notas: 'Biomasa lignocelulósica foliar típica. Documento: 15.75 g de celulosa, 13.5 g de hemicelulosa y pectinas, 6.75 g de lignina y 1.35 g de polifenoles por 45 g.',
    },
    {
      id: 'compost-hojas', nombre: 'Compost de hojas', recurso: null,
      fracciones: { celulosa: 0.10, hemicelulosa: 0.15, lignina: 0.35, polifenoles: 0.10 },
      notas: 'Materia orgánica humificada por biodegradación aerobia. Documento: celulosa lábil 0.10, lignina y ácidos fúlvicos/húmicos 0.35, polisacáridos refractarios 0.15, polifenoles y taninos 0.10 (22.5 g → 2.25 g, 7.875 g, 3.375 g, 2.25 g).',
    },
    {
      id: 'escamas-ficus', nombre: 'Escamas de ficus (hoja triturada 2–3 mm)', recurso: 'triturada',
      fracciones: { celulosa: 0.385, hemicelulosa: 0.305, lignina: 0.234, extractivos: 0.029, cenizas: 0.045 },
      notas: 'Hojas secas y ramillas tiernas secadas al sol y trituradas hasta escamas finas de 2 a 3 mm. Composición de hoja/fibra cruda (% base seca) del documento.',
    },
    {
      id: 'pasta-aglutinante', nombre: 'Pasta aglutinante húmeda', recurso: null, fracciones: {},
      notas: '30 g en la receta de 150 g.',
    },
    { id: 'arcilla-local', nombre: 'Arcilla local (región de Jiquilpan)', recurso: null, fracciones: {}, notas: 'Se mezcla con la fibra de ficus, compost o humus y el inóculo.' },
    { id: 'humus', nombre: 'Compost maduro o humus', recurso: null, fracciones: {}, notas: 'Parte de la matriz junto con la fibra de ficus y la arcilla local.' },
  ],

  // Fórmulas de mezcla (porcentajes en masa). Al crear un lote se eligen y se escalan a la masa deseada.
  formulas: [
    {
      id: 'formula-base-150g', nombre: 'Receta de 150 g del documento', masaTotalG: 150,
      ingredientes: [
        { ingredienteId: 'biochar-ramas-ficus', porcentaje: 35 },
        { ingredienteId: 'harina-pasto-hojas', porcentaje: 30 },
        { ingredienteId: 'compost-hojas', porcentaje: 15 },
        { ingredienteId: 'pasta-aglutinante', porcentaje: 20 },
      ],
      notas: 'Para preparar 150 g de materia prima: 52.5 g de biochar de ramas de ficus, 45 g de harina hecha de pasto y hojas, 22.5 g de compost de hojas y 30 g de pasta aglutinante húmeda.',
    },
    {
      id: 'composicion-documento', nombre: 'Composición del documento (55 / 30 / 15 %)', masaTotalG: 150,
      ingredientes: [
        { ingredienteId: 'biochar-ramas-ficus', porcentaje: 55 },
        { ingredienteId: 'harina-pasto-hojas', porcentaje: 30 },
        { ingredienteId: 'compost-hojas', porcentaje: 15 },
      ],
      notas: 'Composición: biochar de ramas de ficus 55 %, harina hecha de pasto y hojas 30 %, compost de hojas o molienda fina 15 %.',
    },
  ],
};
