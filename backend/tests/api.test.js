const os = require('os');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';
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

describe('API Píldoras Bióticas', () => {
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

  test('valida que la mezcla del lote sume 100%', async () => {
    const res = await comoVol(request(app))
      .post('/api/lotes')
      .send({ especieId: 'mezquite', cantidad: 50, arcillaPct: 60, compostPct: 20, ficusPct: 10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/100%/);
  });

  test('flujo completo: poda → lote → dispersión → seguimiento → stats', async () => {
    await comoVol(request(app)).post('/api/entregas-poda').send({ puntoId: 'bosque-cuauhtemoc', kg: 12.5 }).expect(201);

    const lote = await comoVol(request(app))
      .post('/api/lotes')
      .send({ especieId: 'mezquite', cantidad: 100, arcillaPct: 50, compostPct: 30, ficusPct: 20 })
      .expect(201);
    expect(lote.body.data.codigo).toBe('L-001');

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
      .send({ tratamiento: 'C-arcilla+compost+ficus', prueba: 'retencionAgua', valor: 32 })
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

    // 100 píldoras × 20 g × 20 % ficus = 0.4 kg
    const lote = await comoVol(request(app))
      .post('/api/lotes')
      .send({ especieId: 'huizache', cantidad: 100, arcillaPct: 50, compostPct: 30, ficusPct: 20 })
      .expect(201);
    expect(lote.body.data.kgFicus).toBe(0.4);
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

    // Bosque Cuauhtémoc poda martes y jueves → 2 jornadas por semana
    const gen = await comoAdmin(request(app)).post('/api/zonas-poda/zona-bosque-cuauhtemoc/generar-jornadas').send({ semanas: 2 }).expect(201);
    expect(gen.body.data).toHaveLength(4);
    expect(gen.body.data[0]).toMatchObject({ horaInicio: '08:00', puntoDestinoId: 'bosque-cuauhtemoc', estado: 'programada' });

    // Generar otra vez no duplica
    const otra = await comoAdmin(request(app)).post('/api/zonas-poda/zona-bosque-cuauhtemoc/generar-jornadas').send({ semanas: 2 });
    expect(otra.body.data).toHaveLength(0);

    const proximas = await comoVol(request(app)).get('/api/jornadas/proximas');
    expect(proximas.body.data).toHaveLength(4);
    expect(proximas.body.data[0].zona.nombre).toBe('Bosque Cuauhtémoc');

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

  test('valida formato de fecha y hora de jornadas', async () => {
    const res = await comoAdmin(request(app))
      .post('/api/jornadas')
      .send({ zonaId: 'zona-centro-sahuayo', fecha: '16/10/2026', horaInicio: '7am' });
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
    await comoVol(request(app).post('/api/zonas-poda/zona-centro-sahuayo/generar-jornadas').send({})).expect(403);
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
});
