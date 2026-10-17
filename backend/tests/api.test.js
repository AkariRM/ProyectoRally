const os = require('os');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = ''; // usar archivo temporal aunque .env apunte a Supabase
process.env.ADMIN_EMAIL = 'admin@test.mx';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pildoras-')), 'db.json');

const request = require('supertest');
const app = require('../src/index');

const login = async (email, password) =>
  (await request(app).post('/api/usuarios/login').send({ email, password })).body.data;

let admin; // { usuario, token }
let vol;
// Agrega el token a una petición: comoVol(request(app).post(url)) o comoVol(request(app)).post(url)
const conToken = token => req => {
  if (typeof req.set === 'function') return req.set('Authorization', `Bearer ${token}`);
  const metodo = m => url => req[m](url).set('Authorization', `Bearer ${token}`);
  return { get: metodo('get'), post: metodo('post'), put: metodo('put'), delete: metodo('delete') };
};
const comoAdmin = req => conToken(admin.token)(req);
const comoVol = req => conToken(vol.token)(req);

// Bola de arcilla clásica: 1000 g (500 arcilla, 300 compost, 200 escamas de ficus)
const ARCILLA_FICUS = [
  { ingredienteId: 'arcilla-local', gramos: 500 },
  { ingredienteId: 'compost-hojas', gramos: 300 },
  { ingredienteId: 'escamas-ficus', gramos: 200 },
];

describe('API Bio Red', () => {
  beforeEach(async () => {
    admin = await login('admin@test.mx', 'admin123');
    await comoAdmin(request(app).post('/api/admin/reset')).expect(200);
    admin = await login('admin@test.mx', 'admin123');
    vol = (await request(app).post('/api/usuarios/registro').send({ email: 'vol@test.mx', password: 'secreta1' })).body.data;
  });

  test('trae especies y puntos de acopio iniciales', async () => {
    const especies = await comoVol(request(app)).get('/api/especies');
    expect(especies.body.data.length).toBeGreaterThan(0);
    const puntos = await comoVol(request(app)).get('/api/puntos-acopio');
    expect(puntos.body.data.map(p => p.id)).toContain('bosque-cuauhtemoc');
  });

  test('el lote pide cuántas esferas salieron o el peso de una esfera', async () => {
    const res = await comoVol(request(app)).post('/api/lotes').send({ especieId: 'mezquite', ingredientes: ARCILLA_FICUS });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cantidad|peso/);
  });

  test('el lote requiere ingredientes válidos en gramos', async () => {
    const sin = await comoVol(request(app)).post('/api/lotes').send({ especieId: 'mezquite' });
    expect(sin.status).toBe(400);
    const malo = await comoVol(request(app)).post('/api/lotes')
      .send({ especieId: 'mezquite', ingredientes: [{ ingredienteId: 'no-existe', gramos: 10 }, { ingredienteId: 'humus', gramos: 0 }] });
    expect(malo.status).toBe(400);
    expect(malo.body.errores).toEqual(expect.arrayContaining(['no existe el ingrediente no-existe', 'los gramos de cada ingrediente deben ser mayores que 0']));
  });

  test('fórmula base del documento: 150 g, balance de masa y consumo de biomasa', async () => {
    const formulas = (await comoVol(request(app)).get('/api/formulas')).body.data;
    expect(formulas.map(f => f.id).sort()).toEqual(['composicion-documento', 'formula-base-150g']);
    expect(formulas.find(f => f.id === 'composicion-documento').ingredientes.map(i => i.porcentaje)).toEqual([55, 30, 15]);
    const base = formulas.find(f => f.id === 'formula-base-150g');
    // 35/30/15/20 % de 150 g = 52.5 g biochar, 45 g harina, 22.5 g compost, 30 g pasta
    const ingredientes = base.ingredientes.map(i => ({ ingredienteId: i.ingredienteId, gramos: (base.masaTotalG * i.porcentaje) / 100 }));
    expect(ingredientes.map(i => i.gramos)).toEqual([52.5, 45, 22.5, 30]);

    const lote = await comoVol(request(app)).post('/api/lotes')
      .send({ especieId: 'mezquite', formulaId: base.id, ingredientes, cantidad: 6 }).expect(201);
    const d = lote.body.data;
    expect(d).toMatchObject({ diametroMm: 25, cantidad: 6 });
    expect(d.composicion.masaTotalG).toBe(150);
    // Resultados del documento ("Integración Cuantitativa"):
    // celulosa 0 + 15.75 + 2.25 = 18 g → 12 %
    expect(d.composicion.componentes.celulosa).toEqual({ gramos: 18, porcentaje: 12 });
    // lignina 12.375 + 6.75 + 7.875 = 27 g → 18 %
    expect(d.composicion.componentes.lignina).toEqual({ gramos: 27, porcentaje: 18 });
    // polisacáridos complejos y pectinas 0 + 13.5 + 3.375 = 16.875 g → 11.25 %
    expect(d.composicion.componentes.hemicelulosa).toEqual({ gramos: 16.88, porcentaje: 11.25 });
    // polifenoles 1.65 + 1.35 + 2.25 = 5.25 g → 3.5 %
    expect(d.composicion.componentes.polifenoles).toEqual({ gramos: 5.25, porcentaje: 3.5 });
    expect(d.consumo).toEqual({ biochar: 0.053, harina: 0.045 });
    expect(d.advertencia).toMatch(/biochar/); // no había biochar registrado
  });

  test('pirólisis y molienda: biochar y harina en el inventario', async () => {
    await comoVol(request(app)).post('/api/entregas-poda').send({ puntoId: 'plaza-jiquilpan', kg: 20, tipoMaterial: 'ramas gruesas' }).expect(201);
    await comoVol(request(app)).post('/api/procesos-biomasa').send({ tipo: 'secado', kgEntrada: 20, kgSalida: 10 }).expect(201);
    await comoVol(request(app)).post('/api/procesos-biomasa').send({ tipo: 'pirolisis', kgEntrada: 6, kgSalida: 1.8, temperaturaC: 500 }).expect(201);
    await comoVol(request(app)).post('/api/procesos-biomasa').send({ tipo: 'molienda', kgEntrada: 3, kgSalida: 2.7 }).expect(201);
    const mucho = await comoVol(request(app)).post('/api/procesos-biomasa').send({ tipo: 'triturado', kgEntrada: 2, kgSalida: 1.5 });
    expect(mucho.status).toBe(400); // solo queda 1 kg seco

    await comoVol(request(app)).post('/api/lotes').send({
      especieId: 'mezquite',
      ingredientes: [{ ingredienteId: 'biochar-ramas-ficus', gramos: 525 }, { ingredienteId: 'harina-pasto-hojas', gramos: 450 }],
      cantidad: 80,
    }).expect(201);

    const { body } = await comoVol(request(app)).get('/api/procesos-biomasa/inventario');
    expect(body.data).toMatchObject({
      seca: 1, harina: 2.25, biocharObtenido: 1.8, harinaObtenida: 2.7,
      rendimientoPirolisis: 30, rendimientoMolienda: 90, usadaPor: { biochar: 0.53, harina: 0.45, triturada: 0 },
    });
    expect(body.data.biochar).toBeCloseTo(1.275, 1); // 1.8 producido − 0.525 usado
  });

  test('flujo completo: poda → lote → dispersión → seguimiento → stats', async () => {
    await comoVol(request(app)).post('/api/entregas-poda').send({ puntoId: 'bosque-cuauhtemoc', kg: 12.5 }).expect(201);

    const lote = await comoVol(request(app))
      .post('/api/lotes')
      .send({ especieId: 'mezquite', ingredientes: ARCILLA_FICUS, pesoPildoraG: 10 })
      .expect(201);
    expect(lote.body.data.codigo).toBe('L-001');
    expect(lote.body.data.cantidad).toBe(100); // 1000 g / 10 g por esfera

    const disp = await comoVol(request(app))
      .post('/api/dispersiones')
      .send({ lat: 19.99, lng: -102.71, zona: 'Cerro San Francisco', loteId: lote.body.data.id, cantidad: 40 })
      .expect(201);
    expect(disp.body.data.especieId).toBe('mezquite');

    await comoVol(request(app))
      .post('/api/seguimientos')
      .send({ dispersionId: disp.body.data.id, germinadas: 10, vivas: 8 })
      .expect(201);

    await comoVol(request(app))
      .post('/api/ensayos')
      .send({ tratamiento: 'matriz-arcilla-ficus', prueba: 'retencionAgua', valor: 32 })
      .expect(201);

    const { body } = await comoVol(request(app)).get('/api/stats');
    expect(body.stats).toMatchObject({
      kgPodaRecibida: 12.5,
      pildorasProducidas: 100,
      pildoras: 40,
      germinadas: 10,
      vivas: 8,
      tasaGerminacion: 25,
    });
    expect(body.stats.ensayos[0]).toMatchObject({ prueba: 'retencionAgua', unidad: '%', promedio: 32 });
  });

  test('inventario de biomasa: fresca → seca → triturada → usada en lote', async () => {
    await comoVol(request(app)).post('/api/entregas-poda').send({ puntoId: 'plaza-jiquilpan', kg: 10 }).expect(201);

    // No se puede secar más de lo que hay
    const demasiado = await comoVol(request(app)).post('/api/procesos-biomasa').send({ tipo: 'secado', kgEntrada: 11, kgSalida: 4 });
    expect(demasiado.status).toBe(400);

    await comoVol(request(app)).post('/api/procesos-biomasa').send({ tipo: 'secado', kgEntrada: 8, kgSalida: 3 }).expect(201);
    await comoVol(request(app))
      .post('/api/procesos-biomasa')
      .send({ tipo: 'triturado', kgEntrada: 3, kgSalida: 2.7, fraccion: 'fina' })
      .expect(201);

    // 1000 g de mezcla con 400 g de escamas de ficus → 0.4 kg del inventario triturado
    const lote = await comoVol(request(app))
      .post('/api/lotes')
      .send({ especieId: 'huizache', ingredientes: [
        { ingredienteId: 'arcilla-local', gramos: 400 }, { ingredienteId: 'compost-hojas', gramos: 200 },
        { ingredienteId: 'escamas-ficus', gramos: 400 },
      ], cantidad: 100 })
      .expect(201);
    expect(lote.body.data.consumo).toEqual({ triturada: 0.4 });
    expect(lote.body.data.advertencia).toBeUndefined();

    const { body } = await comoVol(request(app)).get('/api/procesos-biomasa/inventario');
    expect(body.data).toMatchObject({
      fresca: 2,
      seca: 0,
      triturada: 2.3,
      usada: 0.4,
      perdidaSecado: 62.5,
      rendimientoTriturado: 90,
      trituradaPorFraccion: { fina: 2.7 },
    });
  });

  test('solicitud de recolección: pendiente → asignada → recolectada crea la entrega', async () => {
    const sol = await comoVol(request(app))
      .post('/api/solicitudes')
      .send({ nombre: 'Doña Rosa', direccion: 'Calle Hidalgo 12', lat: 19.99, lng: -102.71, kgEstimados: 15 })
      .expect(201);
    expect(sol.body.data.estado).toBe('pendiente');
    const id = sol.body.data.id;

    // No se puede saltar de pendiente a recolectada
    const salto = await comoVol(request(app))
      .put(`/api/solicitudes/${id}/estado`)
      .send({ estado: 'recolectada', kgReales: 12, puntoId: 'plaza-jiquilpan' });
    expect(salto.status).toBe(400);

    await comoVol(request(app)).put(`/api/solicitudes/${id}/estado`).send({ estado: 'asignada' }).expect(200);
    const fin = await comoVol(request(app))
      .put(`/api/solicitudes/${id}/estado`)
      .send({ estado: 'recolectada', kgReales: 12, puntoId: 'plaza-jiquilpan' })
      .expect(200);
    expect(fin.body.data).toMatchObject({ estado: 'recolectada', kgReales: 12 });

    const entregas = await comoVol(request(app)).get('/api/entregas-poda');
    expect(entregas.body.data).toHaveLength(1);
    expect(entregas.body.data[0]).toMatchObject({ kg: 12, solicitudId: id });

    const { body } = await comoVol(request(app)).get('/api/stats');
    expect(body.stats.biomasa.fresca).toBe(12);
    expect(body.stats.solicitudesPendientes).toBe(0);
  });

  test('zona de poda: genera jornadas, voluntario se apunta y la recolección llega al punto destino', async () => {
    const zonas = await comoVol(request(app)).get('/api/zonas-poda');
    expect(zonas.body.data.length).toBeGreaterThan(0);

    // Zona que poda martes y jueves → 2 jornadas por semana
    const zona = await comoAdmin(request(app))
      .post('/api/zonas-poda')
      .send({
        nombre: 'Zona de prueba', municipio: 'Jiquilpan', tipo: 'parque', lat: 19.99, lng: -102.71, radioM: 100,
        puntoDestinoId: 'bosque-cuauhtemoc', diasSemana: [2, 4], horaInicio: '08:00', horaFin: '12:00',
      })
      .expect(201);
    const zonaId = zona.body.data.id;
    const gen = await comoAdmin(request(app)).post(`/api/zonas-poda/${zonaId}/generar-jornadas`).send({ semanas: 2 }).expect(201);
    expect(gen.body.data).toHaveLength(4);
    expect(gen.body.data[0]).toMatchObject({ horaInicio: '08:00', puntoDestinoId: 'bosque-cuauhtemoc', estado: 'programada' });

    // Generar otra vez no duplica
    const otra = await comoAdmin(request(app)).post(`/api/zonas-poda/${zonaId}/generar-jornadas`).send({ semanas: 2 });
    expect(otra.body.data).toHaveLength(0);

    const proximas = await comoVol(request(app)).get('/api/jornadas/proximas');
    expect(proximas.body.data).toHaveLength(4);
    expect(proximas.body.data[0].zona.nombre).toBe('Zona de prueba');

    const jornadaId = proximas.body.data[0].id;
    const apuntada = await comoVol(request(app)).post(`/api/jornadas/${jornadaId}/apuntarme`).send({}).expect(200);
    expect(apuntada.body.data.voluntarios).toEqual([vol.usuario.id]);

    await comoVol(request(app))
      .put(`/api/jornadas/${jornadaId}/estado`)
      .send({ estado: 'recolectada', kgRecolectados: 25 })
      .expect(200);

    const entregas = await comoVol(request(app)).get('/api/entregas-poda');
    expect(entregas.body.data[0]).toMatchObject({ kg: 25, puntoId: 'bosque-cuauhtemoc', jornadaId, usuarioId: vol.usuario.id });

    const { body } = await comoVol(request(app)).get('/api/stats');
    expect(body.stats.jornadasProximas).toBe(3);
  });

  test('zona con polígono dibujado; lista vacía lo quita y uno inválido se rechaza', async () => {
    const poligono = [[19.99, -102.72], [19.991, -102.718], [19.989, -102.717]];
    const zona = await comoAdmin(request(app))
      .post('/api/zonas-poda')
      .send({ nombre: 'Camellón dibujado', lat: 19.99, lng: -102.718, poligono })
      .expect(201);
    expect(zona.body.data.poligono).toEqual(poligono);

    const mal = await comoAdmin(request(app)).put(`/api/zonas-poda/${zona.body.data.id}`).send({ poligono: [[19.99, -102.72]] });
    expect(mal.status).toBe(400);

    const sin = await comoAdmin(request(app)).put(`/api/zonas-poda/${zona.body.data.id}`).send({ poligono: [] }).expect(200);
    expect(sin.body.data.poligono).toEqual([]);
  });

  test('valida formato de fecha y hora de jornadas', async () => {
    const res = await comoAdmin(request(app))
      .post('/api/jornadas')
      .send({ zonaId: 'zona-plaza-aguadora', fecha: '16/10/2026', horaInicio: '7am' });
    expect(res.status).toBe(400);
    expect(res.body.errores).toHaveLength(2);
  });

  test('rechaza referencias inexistentes', async () => {
    const res = await comoVol(request(app)).post('/api/entregas-poda').send({ puntoId: 'no-existe', kg: 1 });
    expect(res.status).toBe(400);
  });

  test('registro y login con correo y clave; nunca devuelve el hash', async () => {
    const dup = await request(app).post('/api/usuarios/registro').send({ email: 'vol@test.mx', password: 'otra123' });
    expect(dup.status).toBe(409);
    const corta = await request(app).post('/api/usuarios/registro').send({ email: 'x@test.mx', password: '123' });
    expect(corta.status).toBe(400);

    const mal = await request(app).post('/api/usuarios/login').send({ email: 'vol@test.mx', password: 'equivocada' });
    expect(mal.status).toBe(401);

    expect(vol.usuario).toMatchObject({ email: 'vol@test.mx', rol: 'voluntario' });
    expect(vol.usuario.passwordHash).toBeUndefined();
    const yo = await comoVol(request(app).get('/api/usuarios/yo')).expect(200);
    expect(yo.body.data.email).toBe('vol@test.mx');
  });

  test('sin sesión no se puede leer nada (salvo registro y login)', async () => {
    await request(app).get('/api/stats').expect(401);
    await request(app).get('/api/puntos-acopio').expect(401);
    await request(app).get('/api/stats').set('Authorization', 'Bearer token-falso').expect(401);
  });

  test('permisos: sin sesión no se escribe; solo admin administra puntos de acopio', async () => {
    await request(app).post('/api/entregas-poda').send({ puntoId: 'plaza-jiquilpan', kg: 1 }).expect(401);

    const nuevo = { nombre: 'Vivero ITJ', direccion: 'Jiquilpan', lat: 19.99, lng: -102.72, tipo: 'vivero' };
    await comoVol(request(app).post('/api/puntos-acopio').send(nuevo)).expect(403);
    const creado = await comoAdmin(request(app).post('/api/puntos-acopio').send(nuevo)).expect(201);
    const id = creado.body.data.id;

    await comoVol(request(app).put(`/api/puntos-acopio/${id}`).send({ nombre: 'X' })).expect(403);
    const editado = await comoAdmin(request(app).put(`/api/puntos-acopio/${id}`).send({ nombre: 'Vivero del ITJ' })).expect(200);
    expect(editado.body.data.nombre).toBe('Vivero del ITJ');

    await comoAdmin(request(app).delete(`/api/puntos-acopio/${id}`)).expect(200);

    // Un punto con historial no se puede borrar
    await comoVol(request(app).post('/api/entregas-poda').send({ puntoId: 'plaza-sahuayo', kg: 3 })).expect(201);
    const bloqueado = await comoAdmin(request(app).delete('/api/puntos-acopio/plaza-sahuayo'));
    expect(bloqueado.status).toBe(409);

    // Generar jornadas es de admin
    await comoVol(request(app).post('/api/zonas-poda/zona-plaza-aguadora/generar-jornadas').send({})).expect(403);
  });

  test('admin cambia roles de usuarios', async () => {
    await comoVol(request(app).get('/api/usuarios')).expect(403);
    const lista = await comoAdmin(request(app).get('/api/usuarios')).expect(200);
    expect(lista.body.data.map(u => u.email)).toEqual(expect.arrayContaining(['admin@test.mx', 'vol@test.mx']));
    expect(lista.body.data.every(u => u.passwordHash === undefined)).toBe(true);

    await comoAdmin(request(app).put(`/api/usuarios/${vol.usuario.id}/rol`).send({ rol: 'admin' })).expect(200);
    // Ya como admin puede crear puntos
    await comoVol(request(app).post('/api/puntos-acopio').send({ nombre: 'Nuevo', direccion: 'Sahuayo' })).expect(201);
  });

  // Crea un usuario con un rol y devuelve su sesión
  async function crearConRol(email, rol) {
    const s = (await request(app).post('/api/usuarios/registro').send({ email, password: 'secreta1' })).body.data;
    await comoAdmin(request(app).put(`/api/usuarios/${s.usuario.id}/rol`).send({ rol })).expect(200);
    return s;
  }

  test('roles: municipio gestiona la poda, brigadista la reforestación', async () => {
    const muni = await crearConRol('muni@test.mx', 'municipio');
    const brig = await crearConRol('brig@test.mx', 'brigadista');
    const como = s => conToken(s.token);

    const zona = { nombre: 'Camellón Av. Juárez', lat: 19.99, lng: -102.72, diasSemana: [5] };
    await comoVol(request(app).post('/api/zonas-poda').send(zona)).expect(403);
    await como(brig)(request(app).post('/api/zonas-poda').send(zona)).expect(403);
    await como(muni)(request(app).post('/api/zonas-poda').send(zona)).expect(201);

    const area = { nombre: 'Cerro de San Francisco', lat: 19.98, lng: -102.73, hectareas: 12, fechaIncendio: '2026-03-15' };
    await como(muni)(request(app).post('/api/areas-reforestacion').send(area)).expect(403);
    const creada = await como(brig)(request(app).post('/api/areas-reforestacion').send(area)).expect(201);
    expect(creada.body.data).toMatchObject({ estado: 'quemada', riesgoIncendio: 'alto', radioM: 300 });

    // Nadie más que admin borra
    await como(brig)(request(app).delete(`/api/areas-reforestacion/${creada.body.data.id}`)).expect(403);
  });

  test('jornada de reforestación: inscripción con cupo, cierre con asistencia y dispersión', async () => {
    const brig = await crearConRol('brig@test.mx', 'brigadista');
    const como = s => conToken(s.token);
    const otro = (await request(app).post('/api/usuarios/registro').send({ email: 'otro@test.mx', password: 'secreta1' })).body.data;

    const area = (await como(brig)(request(app).post('/api/areas-reforestacion')
      .send({ nombre: 'Ladera norte', lat: 19.98, lng: -102.73, especiesRecomendadas: ['mezquite', 'agave-silvestre'] }))).body.data;

    const fecha = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    const jornada = (await como(brig)(request(app).post('/api/jornadas-reforestacion')
      .send({ titulo: 'Gran reforestación', areaId: area.id, fecha, horaInicio: '07:00', cupo: 1, pildorasMeta: 500 }))
      .expect(201)).body.data;
    expect(jornada).toMatchObject({ estado: 'programada', inscritos: [] });

    await comoVol(request(app).post(`/api/jornadas-reforestacion/${jornada.id}/inscribirme`).send({})).expect(200);
    const llena = await conToken(otro.token)(request(app).post(`/api/jornadas-reforestacion/${jornada.id}/inscribirme`).send({}));
    expect(llena.status).toBe(400);

    const proximas = await comoVol(request(app)).get('/api/jornadas-reforestacion/proximas');
    expect(proximas.body.data[0].area.nombre).toBe('Ladera norte');

    const inscritos = await como(brig)(request(app).get(`/api/jornadas-reforestacion/${jornada.id}/inscritos`)).expect(200);
    expect(inscritos.body.data).toEqual([{ id: vol.usuario.id, email: 'vol@test.mx' }]);
    await comoVol(request(app).get(`/api/jornadas-reforestacion/${jornada.id}/inscritos`)).expect(403);

    const cerrada = await como(brig)(request(app).put(`/api/jornadas-reforestacion/${jornada.id}/cerrar`)
      .send({ estado: 'realizada', asistentes: [vol.usuario.id], pildorasDispersadas: 450, especieId: 'agave-silvestre' }))
      .expect(200);
    expect(cerrada.body.data.dispersionId).toBeDefined();

    const disp = await comoVol(request(app)).get(`/api/dispersiones/${cerrada.body.data.dispersionId}`);
    expect(disp.body.data).toMatchObject({ areaId: area.id, cantidad: 450, especieId: 'agave-silvestre' });

    await comoVol(request(app)).post('/api/seguimientos')
      .send({ dispersionId: disp.body.data.id, germinadas: 90, vivas: 80, alturaPromedioCm: 6.5 })
      .expect(201);

    const areaDespues = await comoVol(request(app)).get(`/api/areas-reforestacion/${area.id}`);
    expect(areaDespues.body.data.estado).toBe('en reforestación');

    const { body } = await comoVol(request(app)).get('/api/stats');
    expect(body.stats.reforestacion).toMatchObject({ areas: 1, jornadasRealizadas: 1, participantes: 1 });
    expect(body.stats.porArea[0]).toMatchObject({ area: 'Ladera norte', pildoras: 450, vivas: 80, alturaPromedioCm: 6.5 });
  });

  test('tipo de poda y aditivos biológicos', async () => {
    await comoVol(request(app)).post('/api/entregas-poda')
      .send({ puntoId: 'plaza-jiquilpan', kg: 4, tipoMaterial: 'hojas', especieArbol: 'Ficus benjamina' }).expect(201);
    await comoVol(request(app)).post('/api/entregas-poda').send({ puntoId: 'plaza-jiquilpan', kg: 6, tipoMaterial: 'ramas finas' }).expect(201);
    const mal = await comoVol(request(app)).post('/api/entregas-poda').send({ puntoId: 'plaza-jiquilpan', kg: 1, tipoMaterial: 'troncos' });
    expect(mal.status).toBe(400);

    const inv = await comoVol(request(app)).get('/api/procesos-biomasa/inventario');
    expect(inv.body.data.recibidaPorTipo).toEqual({ hojas: 4, 'ramas finas': 6 });

    const lote = await comoVol(request(app)).post('/api/lotes').send({
      especieId: 'huizache', ingredientes: ARCILLA_FICUS, pesoPildoraG: 10,
      aditivos: ['micorrizas'], aditivosDetalle: '5 g de inóculo por kg de mezcla',
    }).expect(201);
    expect(lote.body.data.aditivos).toEqual(['micorrizas']);
    const malAditivo = await comoVol(request(app)).post('/api/lotes')
      .send({ especieId: 'huizache', ingredientes: ARCILLA_FICUS, pesoPildoraG: 10, aditivos: ['magia'] });
    expect(malAditivo.status).toBe(400);

    await comoVol(request(app)).post('/api/ensayos')
      .send({ tratamiento: 'receta-150g', prueba: 'grietas', valor: 0 }).expect(201);
    const catalogos = await comoVol(request(app)).get('/api/catalogos');
    expect(catalogos.body.data.roles).toEqual(['admin', 'municipio', 'brigadista', 'voluntario']);
  });

  test('exportar CSV y GeoJSON (solo admin, municipio o brigadista)', async () => {
    await comoVol(request(app).get('/api/exportar/zonas-poda.geojson')).expect(403);

    const geo = await comoAdmin(request(app).get('/api/exportar/zonas-poda.geojson')).expect(200);
    const fc = JSON.parse(geo.text);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features[0].geometry.type).toBe('Polygon'); // círculo de la zona
    expect(fc.features[0].properties.nombre).toBeDefined();

    const puntos = JSON.parse((await comoAdmin(request(app).get('/api/exportar/puntos-acopio.geojson'))).text);
    expect(puntos.features[0].geometry.type).toBe('Point');

    // Con ?token= (para descargar desde el navegador)
    const csv = await request(app).get(`/api/exportar/especies.csv?token=${admin.token}`);
    expect(csv.status).toBe(404); // especies no es exportable…
    const csvZonas = await request(app).get(`/api/exportar/zonas-poda.csv?token=${admin.token}`).expect(200);
    expect(csvZonas.headers['content-type']).toMatch(/text\/csv/);
    expect(csvZonas.text.startsWith('﻿id,')).toBe(true); // BOM para Excel
    expect(csvZonas.text.split(/\r?\n/)[0].split(',')).toContain('nombre');

    await comoAdmin(request(app).get('/api/exportar/lotes.geojson')).expect(400);
    // El token por query solo vale para exportar
    await request(app).get(`/api/stats?token=${admin.token}`).expect(401);
  });

  test('catálogos editables: admin agrega/edita/borra; no se borra lo que está en uso', async () => {
    // Voluntario no puede modificar catálogos
    await comoVol(request(app).post('/api/tratamientos').send({ nombre: 'E – Arcilla + aserrín' })).expect(403);

    // Nuevo tratamiento con id derivado del nombre
    const t = await comoAdmin(request(app).post('/api/tratamientos').send({ nombre: 'E – Arcilla + aserrín' })).expect(201);
    expect(t.body.data.id).toBe('e-arcilla-aserrin');

    // Nueva prueba directa y su uso en un ensayo
    const p = await comoAdmin(request(app).post('/api/pruebas').send({ nombre: 'Diámetro', unidad: 'mm' })).expect(201);
    const ensayo = await comoVol(request(app).post('/api/ensayos'))
      .send({ tratamiento: t.body.data.id, prueba: p.body.data.id, valor: 24 }).expect(201);
    expect(ensayo.body.data.unidad).toBe('mm');

    // Editar el nombre sí; borrar estando en uso no
    await comoAdmin(request(app).put(`/api/tratamientos/${t.body.data.id}`).send({ nombre: 'E – Arcilla + aserrín fino' })).expect(200);
    const bloqueado = await comoAdmin(request(app).delete(`/api/tratamientos/${t.body.data.id}`));
    expect(bloqueado.status).toBe(409);
    expect(bloqueado.body.error).toMatch(/1 ensayo/);

    // Aditivo nuevo usable en lotes; tipo de material nuevo usable en entregas
    const ad = await comoAdmin(request(app).post('/api/aditivos').send({ nombre: 'Trichoderma' })).expect(201);
    await comoVol(request(app).post('/api/lotes')).send({
      especieId: 'mezquite', ingredientes: ARCILLA_FICUS, pesoPildoraG: 10, aditivos: [ad.body.data.id],
    }).expect(201);
    const tm = await comoAdmin(request(app).post('/api/tipos-material').send({ nombre: 'Corteza' })).expect(201);
    await comoVol(request(app).post('/api/entregas-poda')).send({ puntoId: 'plaza-jiquilpan', kg: 2, tipoMaterial: tm.body.data.id }).expect(201);

    // Un catálogo sin uso sí se borra
    const libre = await comoAdmin(request(app).post('/api/aditivos').send({ nombre: 'Sin usar' })).expect(201);
    await comoAdmin(request(app).delete(`/api/aditivos/${libre.body.data.id}`)).expect(200);

    // Especie en uso no se borra; especie nueva se edita
    await comoAdmin(request(app).delete('/api/especies/mezquite')).expect(409);
    const esp = await comoAdmin(request(app).post('/api/especies').send({ nombreComun: 'Fresno', nombreCientifico: 'Fraxinus uhdei' })).expect(201);
    await comoAdmin(request(app).put(`/api/especies/${esp.body.data.id}`).send({ validada: true })).expect(200);

    const cat = await comoVol(request(app)).get('/api/catalogos');
    expect(cat.body.data.tratamientos.map(x => x.id)).toContain('e-arcilla-aserrin');
    expect(cat.body.data.pruebas.find(x => x.id === 'retencionAgua').calculada).toBe(true);
  });

  test('ruta sugerida ordena solicitudes por cercanía y termina en el punto de acopio', async () => {
    const crear = (direccion, lat, lng) => comoVol(request(app)).post('/api/solicitudes')
      .send({ nombre: 'Vecino', direccion, lat, lng, kgEstimados: 10 }).expect(201);
    await crear('Lejos', 20.05, -102.72);
    await crear('Cerca', 19.991, -102.718);
    await crear('Medio', 20.0, -102.72);

    const r = await comoVol(request(app)).get('/api/ruta?lat=19.99&lng=-102.719&puntoId=plaza-sahuayo').expect(200);
    expect(r.body.data.paradas.map(p => p.nombre)).toEqual(['Cerca', 'Medio', 'Lejos', 'Plaza principal de Sahuayo']);
    expect(r.body.data.totalKm).toBeGreaterThan(0);
    expect(r.body.data.googleMapsUrl).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\//);

    await comoVol(request(app)).get('/api/ruta').expect(400);
  });
});
