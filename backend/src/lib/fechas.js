// Fecha en formato YYYY-MM-DD según la hora local del servidor
function fechaLocal(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const validarHora = (campo, valor) =>
  valor === undefined || HORA.test(valor) ? [] : [`${campo} debe tener formato HH:MM`];

const validarFecha = (campo, valor) =>
  valor === undefined || (FECHA.test(valor) && !Number.isNaN(Date.parse(valor)))
    ? []
    : [`${campo} debe tener formato AAAA-MM-DD`];

module.exports = { fechaLocal, validarHora, validarFecha };
