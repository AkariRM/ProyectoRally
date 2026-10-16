const reportes = []; // temporal en memoria

exports.getAll = (req, res) => {
  res.json({ success: true, data: reportes });
};

exports.create = (req, res) => {
  const { puntoId, litros, usuarioId, notas } = req.body;
  if (!puntoId || !litros) {
    return res.status(400).json({ error: 'puntoId y litros son requeridos' });
  }
  const reporte = {
    id: Date.now().toString(),
    puntoId,
    litros: Number(litros),
    aguaSalvada: Number(litros) * 40000, // 1L aceite = 40,000L agua
    usuarioId,
    notas,
    fecha: new Date().toISOString(),
  };
  reportes.push(reporte);
  res.status(201).json({ success: true, data: reporte });
};

exports.getStats = (req, res) => {
  const totalLitros = reportes.reduce((sum, r) => sum + r.litros, 0);
  const aguaSalvada = totalLitros * 40000;
  res.json({
    success: true,
    stats: {
      totalReportes: reportes.length,
      totalLitrosAceite: totalLitros,
      aguaSalvadaLitros: aguaSalvada,
      mensaje: `Se han salvado ${aguaSalvada.toLocaleString()} litros de agua`,
    },
  });
};

exports.getOne = (req, res) => {
  const reporte = reportes.find(r => r.id === req.params.id);
  if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });
  res.json({ success: true, data: reporte });
};
