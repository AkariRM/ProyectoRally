// Catálogos editables desde la app (pantalla Catálogos, solo admin).
// Los ids se conservan iguales a los valores que usaban versiones anteriores.

module.exports = {
  // Mezclas que se comparan en los ensayos: las del documento
  tratamientos: [
    { id: 'receta-150g', nombre: 'Receta de 150 g', descripcion: 'Biochar 52.5 g, harina de pasto y hojas 45 g, compost de hojas 22.5 g, pasta aglutinante 30 g' },
    { id: 'composicion-55-30-15', nombre: 'Composición 55 / 30 / 15 %', descripcion: 'Biochar de ramas de ficus 55 %, harina de pasto y hojas 30 %, compost de hojas 15 %' },
    { id: 'matriz-arcilla-ficus', nombre: 'Matriz de arcilla con fibra de ficus', descripcion: 'Escamas de ficus (2–3 mm) con arcilla local, compost maduro o humus e inóculo local' },
  ],

  // Lo que el documento dice que hace la fibra de ficus en la esfera
  pruebas: [
    {
      id: 'grietas', nombre: 'Agrietamiento al secar', unidad: 'num',
      instrucciones: 'La fibra de ficus actúa como malla interna y evita que la esfera se agriete al secarse con el sol fuerte. Cuenta las grietas de la esfera seca.',
    },
    {
      id: 'retencionAgua', nombre: 'Retención hídrica', unidad: '%', calculada: true,
      instrucciones: 'La cutícula cerosa y el tejido fibroso del ficus atrapan la humedad de las lluvias o el rocío. Pesa la esfera seca y después de mojarla.',
    },
    {
      id: 'germinacion', nombre: 'Germinación', unidad: '%', calculada: true,
      instrucciones: 'Semillas que germinaron de las que se sembraron dentro de las esferas.',
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
