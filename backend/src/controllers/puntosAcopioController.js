// Controlador de Puntos de Acopio
// Aquí se conectará a la base de datos cuando se configure Mongoose

const puntos = []; // temporal en memoria

exports.getAll = (req, res) => {
  res.json({ success: true, data: puntos });
};

exports.create = (req, res) => {
  const { nombre, direccion, lat, lng, tipo } = req.body;
  if (!nombre || !direccion) {
    return res.status(400).json({ error: 'nombre y dirección son requeridos' });
  }
  const nuevo = { id: Date.now().toString(), nombre, direccion, lat, lng, tipo, litros: 0 };
  puntos.push(nuevo);
  res.status(201).json({ success: true, data: nuevo });
};

exports.getOne = (req, res) => {
  const punto = puntos.find(p => p.id === req.params.id);
  if (!punto) return res.status(404).json({ error: 'Punto no encontrado' });
  res.json({ success: true, data: punto });
};

exports.update = (req, res) => {
  const index = puntos.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Punto no encontrado' });
  puntos[index] = { ...puntos[index], ...req.body };
  res.json({ success: true, data: puntos[index] });
};

exports.remove = (req, res) => {
  const index = puntos.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Punto no encontrado' });
  puntos.splice(index, 1);
  res.json({ success: true, mensaje: 'Punto eliminado' });
};
