const os = require('os');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pildoras-')), 'db.json');

const request = require('supertest');
const app = require('../src/index');

describe('API Píldoras Bióticas', () => {
  beforeEach(async () => {
    await request(app).post('/api/admin/reset');
  });

  test('trae especies y puntos de acopio iniciales', async () => {
    const especies = await request(app).get('/api/especies');
    expect(especies.body.data.length).toBeGreaterThan(0);
    const puntos = await request(app).get('/api/puntos-acopio');
    expect(puntos.body.data.map(p => p.id)).toContain('bosque-cuauhtemoc');
  });

  test('valida que la mezcla del lote sume 100%', async () => {
    const res = await request(app)
      .post('/api/lotes')
      .send({ especieId: 'mezquite', cantidad: 50, arcillaPct: 60, compostPct: 20, ficusPct: 10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/100%/);
  });

  test('flujo completo: poda → lote → dispersión → seguimiento → stats', async () => {
    await request(app).post('/api/entregas-poda').send({ puntoId: 'bosque-cuauhtemoc', kg: 12.5 }).expect(201);

    const lote = await request(app)
      .post('/api/lotes')
      .send({ especieId: 'mezquite', cantidad: 100, arcillaPct: 50, compostPct: 30, ficusPct: 20 })
      .expect(201);
    expect(lote.body.data.codigo).toBe('L-001');

    const disp = await request(app)
      .post('/api/dispersiones')
      .send({ lat: 19.99, lng: -102.71, zona: 'Cerro San Francisco', loteId: lote.body.data.id, cantidad: 40 })
      .expect(201);
    expect(disp.body.data.especieId).toBe('mezquite');

    await request(app)
      .post('/api/seguimientos')
      .send({ dispersionId: disp.body.data.id, germinadas: 10, vivas: 8 })
      .expect(201);

    await request(app)
      .post('/api/ensayos')
      .send({ tratamiento: 'C-arcilla+compost+ficus', prueba: 'retencionAgua', valor: 32 })
      .expect(201);

    const { body } = await request(app).get('/api/stats');
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
    await request(app).post('/api/entregas-poda').send({ puntoId: 'plaza-jiquilpan', kg: 10 }).expect(201);

    // No se puede secar más de lo que hay
    const demasiado = await request(app).post('/api/procesos-biomasa').send({ tipo: 'secado', kgEntrada: 11, kgSalida: 4 });
    expect(demasiado.status).toBe(400);

    await request(app).post('/api/procesos-biomasa').send({ tipo: 'secado', kgEntrada: 8, kgSalida: 3 }).expect(201);
    await request(app)
      .post('/api/procesos-biomasa')
      .send({ tipo: 'triturado', kgEntrada: 3, kgSalida: 2.7, fraccion: 'fina' })
      .expect(201);

    // 100 píldoras × 20 g × 20 % ficus = 0.4 kg
    const lote = await request(app)
      .post('/api/lotes')
      .send({ especieId: 'huizache', cantidad: 100, arcillaPct: 50, compostPct: 30, ficusPct: 20 })
      .expect(201);
    expect(lote.body.data.kgFicus).toBe(0.4);
    expect(lote.body.data.advertencia).toBeUndefined();

    const { body } = await request(app).get('/api/procesos-biomasa/inventario');
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
    const sol = await request(app)
      .post('/api/solicitudes')
      .send({ nombre: 'Doña Rosa', direccion: 'Calle Hidalgo 12', lat: 19.99, lng: -102.71, kgEstimados: 15 })
      .expect(201);
    expect(sol.body.data.estado).toBe('pendiente');
    const id = sol.body.data.id;

    // No se puede saltar de pendiente a recolectada
    const salto = await request(app)
      .put(`/api/solicitudes/${id}/estado`)
      .send({ estado: 'recolectada', kgReales: 12, puntoId: 'plaza-jiquilpan' });
    expect(salto.status).toBe(400);

    await request(app).put(`/api/solicitudes/${id}/estado`).send({ estado: 'asignada' }).expect(200);
    const fin = await request(app)
      .put(`/api/solicitudes/${id}/estado`)
      .send({ estado: 'recolectada', kgReales: 12, puntoId: 'plaza-jiquilpan' })
      .expect(200);
    expect(fin.body.data).toMatchObject({ estado: 'recolectada', kgReales: 12 });

    const entregas = await request(app).get('/api/entregas-poda');
    expect(entregas.body.data).toHaveLength(1);
    expect(entregas.body.data[0]).toMatchObject({ kg: 12, solicitudId: id });

    const { body } = await request(app).get('/api/stats');
    expect(body.stats.biomasa.fresca).toBe(12);
    expect(body.stats.solicitudesPendientes).toBe(0);
  });

  test('zona de poda: genera jornadas, voluntario se apunta y la recolección llega al punto destino', async () => {
    const zonas = await request(app).get('/api/zonas-poda');
    expect(zonas.body.data.length).toBeGreaterThan(0);

    // Bosque Cuauhtémoc poda martes y jueves → 2 jornadas por semana
    const gen = await request(app).post('/api/zonas-poda/zona-bosque-cuauhtemoc/generar-jornadas').send({ semanas: 2 }).expect(201);
    expect(gen.body.data).toHaveLength(4);
    expect(gen.body.data[0]).toMatchObject({ horaInicio: '08:00', puntoDestinoId: 'bosque-cuauhtemoc', estado: 'programada' });

    // Generar otra vez no duplica
    const otra = await request(app).post('/api/zonas-poda/zona-bosque-cuauhtemoc/generar-jornadas').send({ semanas: 2 });
    expect(otra.body.data).toHaveLength(0);

    const proximas = await request(app).get('/api/jornadas/proximas');
    expect(proximas.body.data).toHaveLength(4);
    expect(proximas.body.data[0].zona.nombre).toBe('Bosque Cuauhtémoc');

    const usuario = await request(app).post('/api/usuarios/registro').send({ nombre: 'Ana', email: 'ana@test.mx' });
    const jornadaId = proximas.body.data[0].id;
    const apuntada = await request(app)
      .post(`/api/jornadas/${jornadaId}/apuntarme`)
      .send({ usuarioId: usuario.body.data.id })
      .expect(200);
    expect(apuntada.body.data.voluntarios).toEqual([usuario.body.data.id]);

    await request(app)
      .put(`/api/jornadas/${jornadaId}/estado`)
      .send({ estado: 'recolectada', kgRecolectados: 25, usuarioId: usuario.body.data.id })
      .expect(200);

    const entregas = await request(app).get('/api/entregas-poda');
    expect(entregas.body.data[0]).toMatchObject({ kg: 25, puntoId: 'bosque-cuauhtemoc', jornadaId });

    const { body } = await request(app).get('/api/stats');
    expect(body.stats.jornadasProximas).toBe(3);
  });

  test('valida formato de fecha y hora de jornadas', async () => {
    const res = await request(app)
      .post('/api/jornadas')
      .send({ zonaId: 'zona-centro-sahuayo', fecha: '16/10/2026', horaInicio: '7am' });
    expect(res.status).toBe(400);
    expect(res.body.errores).toHaveLength(2);
  });

  test('rechaza referencias inexistentes', async () => {
    const res = await request(app).post('/api/entregas-poda').send({ puntoId: 'no-existe', kg: 1 });
    expect(res.status).toBe(400);
  });
});
