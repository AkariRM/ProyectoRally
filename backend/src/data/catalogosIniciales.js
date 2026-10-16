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
    { id: 'mixto', nombre: 'Mixto' },
  ],
};
