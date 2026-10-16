import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { avisosDisponibles, guardarZonasConAviso, pedirPermiso, programarAvisos, zonasConAviso } from '@/lib/avisos';
import { obtenerUbicacion } from '@/lib/gps';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Jornada, Municipio, ZonaPoda } from '@/lib/types';
import Mapa from '@/components/Mapa';
import {
  aYyyyMmDd, Aviso, Boton, BotonChico, Campo, colores, DIAS_SEMANA, fechaCorta,
  Opciones, OpcionesMultiples, Seccion, Tarjeta,
} from '@/components/ui';
import { alerta } from '@/lib/alerta';

const MUNICIPIOS: Municipio[] = ['Jiquilpan', 'Sahuayo', 'Otro'];
const TIPOS = ['calle', 'plaza', 'parque', 'escuela', 'otro'] as const;
const DIAS = [1, 2, 3, 4, 5, 6, 0];
const NOMBRES_DIA = Object.fromEntries(DIAS_SEMANA.map((n, i) => [i, n])) as Record<number, string>;

const horario = (z: { diasSemana?: number[]; horaInicio?: string; horaFin?: string }) =>
  `${(z.diasSemana ?? []).map(d => DIAS_SEMANA[d]).join(', ') || 'sin días'}` +
  `${z.horaInicio ? ` · ${z.horaInicio}${z.horaFin ? `–${z.horaFin}` : ''}` : ''}`;

// Registrar cuánto se recolectó en una jornada y a qué punto se llevó
function RecoleccionJornada({ jornada, puntos, onListo }: {
  jornada: Jornada; puntos: { id: string; nombre: string }[]; onListo: () => void;
}) {
  const { usuario } = useUsuario();
  const [kg, setKg] = useState('');
  const [puntoId, setPuntoId] = useState<string | null>(jornada.puntoDestinoId ?? null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (!puntoId) return alerta('Falta dato', 'Elige el punto de acopio destino');
    setEnviando(true);
    try {
      await api.cambiarEstadoJornada(jornada.id, {
        estado: 'recolectada', kgRecolectados: Number(kg), puntoDestinoId: puntoId, usuarioId: usuario?.id,
      });
      alerta('¡Gracias!', `${kg} kg registrados en el punto de acopio.`);
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.subform}>
      <Campo etiqueta="Kg de poda recolectada" value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="Ej: 30" />
      <Opciones
        etiqueta="Se llevó al punto"
        opciones={puntos.map(p => p.id)}
        nombres={Object.fromEntries(puntos.map(p => [p.id, p.nombre]))}
        valor={puntoId}
        onChange={setPuntoId}
      />
      <Boton texto="Guardar recolección" color={colores.tierra} onPress={guardar} cargando={enviando} />
    </View>
  );
}

function NuevaZona({ puntos, onListo }: { puntos: { id: string; nombre: string }[]; onListo: () => void }) {
  const { usuario } = useUsuario();
  const [nombre, setNombre] = useState('');
  const [municipio, setMunicipio] = useState<Municipio | null>('Jiquilpan');
  const [tipo, setTipo] = useState<(typeof TIPOS)[number] | null>('calle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radio, setRadio] = useState('150');
  const [dias, setDias] = useState<number[]>([]);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('12:00');
  const [responsable, setResponsable] = useState('');
  const [destino, setDestino] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (!coords) return alerta('Falta ubicación', 'Párate en la zona y toca "Tomar ubicación".');
    setEnviando(true);
    try {
      await api.crearZonaPoda({
        nombre, municipio: municipio ?? undefined, tipo: tipo ?? undefined, lat: coords.lat, lng: coords.lng,
        radioM: Number(radio), diasSemana: dias, horaInicio, horaFin, responsable,
        puntoDestinoId: destino ?? undefined, usuarioId: usuario?.id,
      } as Partial<ZonaPoda>);
      alerta('Zona creada', 'Ahora puedes generar sus jornadas de poda.');
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta>
      <Campo etiqueta="Nombre de la zona" value={nombre} onChangeText={setNombre} placeholder="Ej: Av. Lázaro Cárdenas, tramo centro" />
      <Opciones etiqueta="Municipio" opciones={MUNICIPIOS} valor={municipio} onChange={setMunicipio} />
      <Opciones etiqueta="Tipo" opciones={TIPOS} valor={tipo} onChange={setTipo} />
      <Boton
        texto={coords ? `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : '📍 Tomar ubicación (centro de la zona)'}
        onPress={async () => setCoords(await obtenerUbicacion('marcar la zona de poda'))}
        secundario={!!coords}
      />
      <Campo etiqueta="Radio (metros)" value={radio} onChangeText={setRadio} keyboardType="number-pad" />
      <OpcionesMultiples etiqueta="Días de poda" opciones={DIAS} valores={dias} onChange={setDias} nombres={NOMBRES_DIA} />
      <View style={styles.fila}>
        <View style={{ flex: 1 }}><Campo etiqueta="Desde (HH:MM)" value={horaInicio} onChangeText={setHoraInicio} /></View>
        <View style={{ flex: 1 }}><Campo etiqueta="Hasta (HH:MM)" value={horaFin} onChangeText={setHoraFin} /></View>
      </View>
      <Campo etiqueta="¿Quién poda?" value={responsable} onChangeText={setResponsable} placeholder="Ej: Servicios Públicos Municipales" />
      <Opciones
        etiqueta="Punto de acopio destino"
        opciones={puntos.map(p => p.id)}
        nombres={Object.fromEntries(puntos.map(p => [p.id, p.nombre]))}
        valor={destino}
        onChange={setDestino}
      />
      <Boton texto="Guardar zona" onPress={guardar} cargando={enviando} />
    </Tarjeta>
  );
}

function NuevaJornada({ zonas, onListo }: { zonas: ZonaPoda[]; onListo: () => void }) {
  const [zonaId, setZonaId] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [horaInicio, setHoraInicio] = useState('');
  const [enviando, setEnviando] = useState(false);

  const proximosDias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return aYyyyMmDd(d);
  });

  const guardar = async () => {
    if (!zonaId || !fecha) return alerta('Falta dato', 'Elige zona y fecha');
    setEnviando(true);
    try {
      await api.crearJornada({ zonaId, fecha, horaInicio: horaInicio || undefined });
      alerta('Jornada programada', 'Se avisará a quien siga esta zona.');
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta>
      <Opciones etiqueta="Zona" opciones={zonas.map(z => z.id)} nombres={Object.fromEntries(zonas.map(z => [z.id, z.nombre]))} valor={zonaId} onChange={setZonaId} />
      <Opciones etiqueta="Fecha" opciones={proximosDias} nombres={Object.fromEntries(proximosDias.map(d => [d, fechaCorta(d)]))} valor={fecha} onChange={setFecha} />
      <Campo etiqueta="Hora de inicio (opcional)" value={horaInicio} onChangeText={setHoraInicio} placeholder="Si no, usa el horario de la zona" />
      <Boton texto="Programar jornada" onPress={guardar} cargando={enviando} />
    </Tarjeta>
  );
}

export default function Zonas() {
  const { usuario } = useUsuario();
  const { data, error, recargar } = useData(async () => {
    const [zonas, jornadas, puntos] = await Promise.all([api.zonasPoda(), api.jornadasProximas(), api.puntosAcopio()]);
    return { zonas, jornadas, puntos };
  });
  const [suscritas, setSuscritas] = useState<string[]>([]);
  const [avisosProgramados, setAvisosProgramados] = useState<number | null>(null);
  const [recolectando, setRecolectando] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<'zona' | 'jornada' | null>(null);

  useEffect(() => {
    zonasConAviso().then(setSuscritas);
  }, []);

  // Reprograma los avisos cada vez que cambian las jornadas o las zonas seguidas
  useEffect(() => {
    if (!data) return;
    programarAvisos(data.jornadas, suscritas).then(setAvisosProgramados).catch(() => setAvisosProgramados(null));
  }, [data, suscritas]);

  const zonas = data?.zonas ?? [];
  const puntos = data?.puntos ?? [];
  const jornadas = data?.jornadas ?? [];
  const nombrePunto = Object.fromEntries(puntos.map(p => [p.id, p.nombre]));

  const alternarAviso = async (zonaId: string) => {
    const activar = !suscritas.includes(zonaId);
    if (!avisosDisponibles) {
      return alerta('Solo en celular', 'Los avisos de poda funcionan en la app de Expo Go, no en el navegador.');
    }
    if (activar && !(await pedirPermiso())) {
      return alerta('Sin permiso', 'Activa las notificaciones de la app en los ajustes del celular.');
    }
    const nuevas = activar ? [...suscritas, zonaId] : suscritas.filter(z => z !== zonaId);
    setSuscritas(nuevas);
    await guardarZonasConAviso(nuevas);
  };

  const apuntarme = async (j: Jornada) => {
    if (!usuario) return alerta('Regístrate', 'Regístrate en Inicio para apuntarte a una jornada.');
    try {
      await api.apuntarmeJornada(j.id, usuario.id, j.voluntarios.includes(usuario.id));
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    }
  };

  const generar = async (zona: ZonaPoda) => {
    try {
      const creadas = await api.generarJornadas(zona.id, 4);
      alerta('Listo', `${creadas.length} jornadas nuevas para las próximas 4 semanas.`);
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    }
  };

  const terminar = () => {
    setRecolectando(null);
    setFormulario(null);
    recargar();
  };

  return (
    <>
      {error ? <Aviso texto={error} /> : null}
      <Mapa
        zonas={zonas.map(z => ({ id: z.id, lat: z.lat, lng: z.lng, radioM: z.radioM, activa: suscritas.includes(z.id) }))}
        puntos={puntos
          .filter(p => p.lat !== undefined && p.lng !== undefined)
          .map(p => ({ id: p.id, lat: p.lat!, lng: p.lng!, titulo: p.nombre, descripcion: 'Punto de acopio', color: 'orange' }))}
      />
      <Text style={styles.leyenda}>🟤 Zona de poda   🟢 Zona con aviso   🟠 Punto de acopio</Text>
      <Aviso
        tipo="info"
        texto={suscritas.length
          ? `🔔 Sigues ${suscritas.length} zona(s) · ${avisosProgramados ?? 0} avisos programados (un día antes a las 19:00 y 1 hora antes).`
          : 'Toca "🔔 Avisarme" en una zona para recibir aviso antes de cada poda.'}
      />

      <Seccion>Próximas jornadas de poda</Seccion>
      {!jornadas.length ? <Text style={styles.detalle}>No hay jornadas programadas. Genera las de una zona abajo.</Text> : null}
      {jornadas.slice(0, 20).map(j => {
        const voy = !!usuario && j.voluntarios.includes(usuario.id);
        return (
          <Tarjeta key={j.id}>
            <Text style={styles.nombre}>{fechaCorta(j.fecha)} · {j.horaInicio ?? ''}{j.horaFin ? `–${j.horaFin}` : ''}</Text>
            <Text style={styles.zona}>{j.zona?.nombre ?? j.zonaId}</Text>
            <Text style={styles.detalle}>
              Llevar a: {nombrePunto[j.puntoDestinoId ?? ''] ?? 'sin destino'} · {j.voluntarios.length} voluntario(s)
            </Text>
            <View style={styles.acciones}>
              <BotonChico texto={voy ? '✓ Voy' : 'Me apunto'} relleno={voy} onPress={() => apuntarme(j)} />
              <BotonChico texto="Registrar recolección" color={colores.tierra} onPress={() => setRecolectando(recolectando === j.id ? null : j.id)} />
            </View>
            {recolectando === j.id ? <RecoleccionJornada jornada={j} puntos={puntos} onListo={terminar} /> : null}
          </Tarjeta>
        );
      })}

      <Seccion>Zonas de poda</Seccion>
      {zonas.map(z => (
        <Tarjeta key={z.id}>
          <Text style={styles.nombre}>{z.nombre}</Text>
          <Text style={styles.detalle}>{horario(z)}</Text>
          {z.responsable ? <Text style={styles.detalle}>Poda: {z.responsable}</Text> : null}
          <Text style={styles.detalle}>Destino: {nombrePunto[z.puntoDestinoId ?? ''] ?? 'sin definir'}</Text>
          {z.notas ? <Text style={styles.nota}>{z.notas}</Text> : null}
          <View style={styles.acciones}>
            <BotonChico
              texto={suscritas.includes(z.id) ? '🔔 Avisos activos' : '🔕 Avisarme'}
              relleno={suscritas.includes(z.id)}
              onPress={() => alternarAviso(z.id)}
            />
            <BotonChico texto="Generar jornadas" color={colores.azul} onPress={() => generar(z)} />
          </View>
        </Tarjeta>
      ))}

      <View style={styles.acciones}>
        <BotonChico texto="+ Nueva zona" relleno={formulario === 'zona'} onPress={() => setFormulario(formulario === 'zona' ? null : 'zona')} />
        <BotonChico texto="+ Jornada puntual" relleno={formulario === 'jornada'} onPress={() => setFormulario(formulario === 'jornada' ? null : 'jornada')} />
      </View>
      {formulario === 'zona' ? <NuevaZona puntos={puntos} onListo={terminar} /> : null}
      {formulario === 'jornada' ? <NuevaJornada zonas={zonas} onListo={terminar} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  leyenda: { fontSize: 12, color: colores.textoSuave, marginBottom: 8 },
  nombre: { fontSize: 15, fontWeight: '700', color: colores.texto },
  zona: { fontSize: 14, color: colores.verde, marginTop: 2, fontWeight: '600' },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  nota: { fontSize: 12, color: colores.ambar, marginTop: 4, fontStyle: 'italic' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap' },
  subform: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  fila: { flexDirection: 'row', gap: 8 },
});
