const usuarios = []; // temporal en memoria

exports.register = (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  if (usuarios.find(u => u.email === email)) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }
  const usuario = { id: Date.now().toString(), nombre, email, puntos: 0, litros: 0 };
  usuarios.push(usuario);
  res.status(201).json({ success: true, data: usuario });
};

exports.login = (req, res) => {
  const { email } = req.body;
  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ success: true, data: usuario });
};

exports.getProfile = (req, res) => {
  const usuario = usuarios.find(u => u.id === req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ success: true, data: usuario });
};
