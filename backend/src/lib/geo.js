// Polígono dibujado en el mapa: lista de puntos [lat, lng] (al menos 3).
// Una lista vacía quita el polígono y la zona vuelve a ser un círculo (lat, lng, radioM).
function validarPoligono(poligono) {
  if (poligono === undefined) return [];
  const ok = Array.isArray(poligono) && (poligono.length === 0 || (poligono.length >= 3 &&
    poligono.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) &&
      Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180)));
  return ok ? [] : ['poligono debe ser una lista de al menos 3 puntos [lat, lng]'];
}

module.exports = { validarPoligono };
