import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { actualizarAvisos, avisosDisponibles, guardarZonasConAviso, pedirPermiso, zonasConAviso } from '@/lib/avisos';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Jornada, Municipio, TipoMaterial, ZonaPoda } from '@/lib/types';
import { nombresDe, useCatalogos } from '@/lib/catalogos';
import Mapa from '@/components/Mapa';
import ModalPasos from '@/components/ModalPasos';
import SelectorUbicacion from '@/components/SelectorUbicacion';
import {
  aYyyyMmDd, Aviso, Boton, BotonChico, Campo, colores, DIAS_SEMANA, fechaCorta,
  ListaDesplegable, Opciones, OpcionesMultiples, Seccion, Tarjeta,
} from '@/components/ui';
import { alerta, confirmar } from '@/lib/alerta';

const MUNICIPIOS: Municipio[] = ['Jiquilpan', 'Sahuayo', 'Otro'];
const TIPOS = ['calle', 'plaza', 'parque', 'escuela', 'otro'] as const;
const DIAS = [1, 2, 3, 4, 5, 6, 0];
const NOMBRES_DIA = Object.fromEntries(DIAS_SEMANA.map((n, i) => [i, n])) as Record<number, string>;

// Ubicación provisional: campo explícito o, en datos anteriores, deducido de la nota
export const porConfirmar = (z: ZonaPoda) =>
  z.ubicacionConfirmada === false ||
  (z.ubicacionConfirmada === undefined && /ubicaci[oó]n/i.test(z.notas ?? '') && /(por confirmar|aproximada)/i.test(z.notas ?? ''));

const horario = (z: { diasSemana?: number[]; horaInicio?: string; horaFin?: string }) =>
  `${(z.diasSemana ?? []).map(d => DIAS_SEMANA[d]).join(', ') || 'sin días'}` +
  `${z.horaInicio ? ` · ${z.horaInicio}${z.horaFin ? `–${z.horaFin}` : ''}` : ''}`;

// Registrar cuánto se recolectó en una jornada y a qué punto se llevó
function RecoleccionJornada({ jornada, puntos, onListo, onCerrar }: {
  jornada: Jornada; puntos: { id: string; nombre: string }[]; onListo: () => void; onCerrar: () => void;
}) {
  const [kg, setKg] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState<TipoMaterial | null>(null);
  const { data: catalogos } = useCatalogos();
  const [puntoId, setPuntoId] = useState<string | null>(jornada.puntoDestinoId ?? null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (!puntoId) return alerta('Falta dato', 'Elige el punto de acopio destino');
    setEnviando(true);
    try {
      await api.cambiarEstadoJornada(jornada.id, {
        estado: 'recolectada', kgRecolectados: Number(kg), puntoDestinoId: puntoId, tipoMaterial: tipoMaterial ?? undefined,
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
    <ModalPasos
      titulo="Registrar recolección"
      color={colores.tierra}
      onCerrar={onCerrar}
      onFinal={guardar}
      cargando={enviando}
      textoFinal="Guardar recolección"
      pasos={[
        {
          titulo: 'Cantidad',
          falta: Number(kg) > 0 ? null : 'Escribe cuántos kg se recolectaron',
          contenido: (
            <>
              <Text style={styles.contexto}>{fechaCorta(jornada.fecha)} · {jornada.zona?.nombre ?? jornada.zonaId}</Text>
              <Campo etiqueta="Kg de poda recolectada" value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="Ej: 30" />
              <Opciones
                etiqueta="Tipo de material"
                opciones={(catalogos?.tiposMaterial ?? []).map(t => t.id)}
                nombres={nombresDe(catalogos?.tiposMaterial)}
                valor={tipoMaterial}
                onChange={setTipoMaterial}
              />
            </>
          ),
        },
        {
          titulo: 'Destino',
          falta: puntoId ? null : 'Elige el punto de acopio destino',
          contenido: (
            <Opciones
              etiqueta="Se llevó al punto"
              opciones={puntos.map(p => p.id)}
              nombres={Object.fromEntries(puntos.map(p => [p.id, p.nombre]))}
              valor={puntoId}
              onChange={setPuntoId}
            />
          ),
        },
      ]}
    />
  );
}

// Crear o editar una zona de poda (solo admin)
function FormZona({ zona, puntos, onListo, onCancelar }: {
  zona?: ZonaPoda; puntos: { id: string; nombre: string }[]; onListo: () => void; onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(zona?.nombre ?? '');
  const [municipio, setMunicipio] = useState<Municipio | null>(zona?.municipio ?? 'Jiquilpan');
  const [tipo, setTipo] = useState<(typeof TIPOS)[number] | null>(zona?.tipo ?? 'calle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(zona ? { lat: zona.lat, lng: zona.lng } : null);
  const [radio, setRadio] = useState(String(zona?.radioM ?? 150));
  const [dias, setDias] = useState<number[]>(zona?.diasSemana ?? []);
  const [horaInicio, setHoraInicio] = useState(zona?.horaInicio ?? '08:00');
  const [horaFin, setHoraFin] = useState(zona?.horaFin ?? '12:00');
  const [responsable, setResponsable] = useState(zona?.responsable ?? '');
  const [destino, setDestino] = useState<string | null>(zona?.puntoDestinoId ?? null);
  const [notas, setNotas] = useState(zona?.notas ?? '');
  const [confirmada, setConfirmada] = useState<'sí' | 'no'>(zona && porConfirmar(zona) ? 'no' : 'sí');
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (!coords) return alerta('Falta ubicación', 'Toca el mapa para marcar la zona o usa tu ubicación.');
    setEnviando(true);
    const datos: Partial<ZonaPoda> = {
      nombre, municipio: municipio ?? undefined, tipo: tipo ?? undefined, lat: coords.lat, lng: coords.lng,
      radioM: Number(radio), diasSemana: dias, horaInicio, horaFin, responsable,
      ubicacionConfirmada: confirmada === 'sí',
      puntoDestinoId: destino ?? undefined, notas,
    };
    try {
      if (zona) await api.editarZonaPoda(zona.id, datos);
      else await api.crearZonaPoda(datos);
      alerta(zona ? 'Zona actualizada' : 'Zona creada', dias.length ? 'Ahora puedes generar sus jornadas de poda.' : '');
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalPasos
      titulo={zona ? `Editar: ${zona.nombre}` : 'Nueva zona de poda'}
      onCerrar={onCancelar}
      onFinal={guardar}
      cargando={enviando}
      textoFinal={zona ? 'Guardar cambios' : 'Guardar zona'}
      pasos={[
        {
          titulo: 'Datos',
          falta: nombre.trim() ? null : 'Escribe el nombre de la zona',
          contenido: (
            <>
              <Campo etiqueta="Nombre de la zona" value={nombre} onChangeText={setNombre} placeholder="Ej: Av. Lázaro Cárdenas, tramo centro" />
              <Opciones etiqueta="Municipio" opciones={MUNICIPIOS} valor={municipio} onChange={setMunicipio} />
              <Opciones etiqueta="Tipo" opciones={TIPOS} valor={tipo} onChange={setTipo} />
            </>
          ),
        },
        {
          titulo: 'Ubicación',
          falta: coords ? null : 'Toca el mapa para marcar la zona o usa tu ubicación',
          contenido: (
            <>
              <SelectorUbicacion
                etiqueta="Centro de la zona"
                valor={coords}
                motivo="marcar la zona de poda"
                onChange={c => {
                  setCoords(c);
                  setConfirmada('sí'); // marcada en el mapa o con GPS → ubicación real
                }}
              />
              <Opciones etiqueta="¿Ubicación confirmada?" opciones={['sí', 'no'] as const} valor={confirmada} onChange={setConfirmada} />
              <Campo etiqueta="Radio (metros)" value={radio} onChangeText={setRadio} keyboardType="number-pad" />
            </>
          ),
        },
        {
          titulo: 'Horario',
          contenido: (
            <>
              <OpcionesMultiples etiqueta="Días de poda" opciones={DIAS} valores={dias} onChange={setDias} nombres={NOMBRES_DIA} />
              <View style={styles.fila}>
                <View style={{ flex: 1 }}><Campo etiqueta="Desde (HH:MM)" value={horaInicio} onChangeText={setHoraInicio} /></View>
                <View style={{ flex: 1 }}><Campo etiqueta="Hasta (HH:MM)" value={horaFin} onChangeText={setHoraFin} /></View>
              </View>
              <Campo etiqueta="¿Quién poda?" value={responsable} onChangeText={setResponsable} placeholder="Ej: Servicios Públicos Municipales" />
            </>
          ),
        },
        {
          titulo: 'Destino',
          contenido: (
            <>
              <Opciones
                etiqueta="Punto de acopio destino"
                opciones={puntos.map(p => p.id)}
                nombres={Object.fromEntries(puntos.map(p => [p.id, p.nombre]))}
                valor={destino}
                onChange={setDestino}
              />
              <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline />
            </>
          ),
        },
      ]}
    />
  );
}

function NuevaJornada({ zonas, onListo, onCerrar }: { zonas: ZonaPoda[]; onListo: () => void; onCerrar: () => void }) {
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
    <ModalPasos
      titulo="Jornada puntual de poda"
      onCerrar={onCerrar}
      onFinal={guardar}
      cargando={enviando}
      textoFinal="Programar jornada"
      pasos={[
        {
          titulo: 'Zona',
          falta: zonaId ? null : 'Elige la zona',
          contenido: <Opciones etiqueta="Zona" opciones={zonas.map(z => z.id)} nombres={Object.fromEntries(zonas.map(z => [z.id, z.nombre]))} valor={zonaId} onChange={setZonaId} />,
        },
        {
          titulo: 'Fecha y hora',
          falta: fecha ? null : 'Elige la fecha',
          contenido: (
            <>
              <Opciones etiqueta="Fecha" opciones={proximosDias} nombres={Object.fromEntries(proximosDias.map(d => [d, fechaCorta(d)]))} valor={fecha} onChange={setFecha} />
              <Campo etiqueta="Hora de inicio (opcional)" value={horaInicio} onChangeText={setHoraInicio} placeholder="Si no, usa el horario de la zona" />
            </>
          ),
        },
      ]}
    />
  );
}

export default function Zonas() {
  const { usuario, esAdmin, puede } = useUsuario();
  const gestiona = puede('municipio'); // admin o municipio
  const { data, error, recargar } = useData(async () => {
    const [zonas, jornadas, puntos] = await Promise.all([api.zonasPoda(), api.jornadasProximas(), api.puntosAcopio()]);
    return { zonas, jornadas, puntos };
  });
  const [suscritas, setSuscritas] = useState<string[]>([]);
  const [avisosProgramados, setAvisosProgramados] = useState<number | null>(null);
  const [recolectando, setRecolectando] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<'zona' | 'jornada' | null>(null);
  const [editandoZona, setEditandoZona] = useState<string | null>(null);

  useEffect(() => {
    zonasConAviso().then(setSuscritas);
  }, []);

  // Reprograma los avisos cada vez que cambian las jornadas o las zonas seguidas
  useEffect(() => {
    if (!data) return;
    actualizarAvisos(usuario?.id).then(setAvisosProgramados).catch(() => setAvisosProgramados(null));
  }, [data, suscritas, usuario?.id]);

  const zonas = data?.zonas ?? [];
  const puntos = data?.puntos ?? [];
  const jornadas = data?.jornadas ?? [];
  const nombrePunto = Object.fromEntries(puntos.map(p => [p.id, p.nombre]));
  const zonaEditada = zonas.find(z => z.id === editandoZona);
  const jornadaRecolectada = jornadas.find(j => j.id === recolectando);

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
      await api.apuntarmeJornada(j.id, j.voluntarios.includes(usuario.id));
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

  const eliminarZona = async (zona: ZonaPoda) => {
    if (!(await confirmar('Eliminar zona', `¿Eliminar "${zona.nombre}" y sus jornadas programadas?`))) return;
    try {
      await api.eliminarZonaPoda(zona.id);
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    }
  };

  const terminar = () => {
    setRecolectando(null);
    setFormulario(null);
    setEditandoZona(null);
    recargar();
  };

  return (
    <>
      {error ? <Aviso texto={error} /> : null}
      <Mapa
        alto={260}
        zonas={zonas.map(z => ({
          id: z.id, lat: z.lat, lng: z.lng, radioM: z.radioM, titulo: z.nombre,
          activa: suscritas.includes(z.id), porConfirmar: porConfirmar(z),
        }))}
        puntos={puntos
          .filter(p => p.lat !== undefined && p.lng !== undefined)
          .map(p => ({ id: p.id, lat: p.lat!, lng: p.lng!, titulo: p.nombre, descripcion: 'Punto de acopio', color: 'orange' }))}
      />
      <Text style={styles.leyenda}>🟤 Zona de poda   🟢 Zona con aviso   🟠 Punto de acopio   ⚪ ? Zona por ubicar</Text>
      <Aviso
        tipo="info"
        texto={suscritas.length
          ? `🔔 Sigues ${suscritas.length} zona(s) · ${avisosProgramados ?? 0} avisos programados (un día antes a las 19:00 y 1 hora antes).`
          : 'Toca "🔔 Avisarme" en una zona para recibir aviso antes de cada poda.'}
      />

      {zonas.some(porConfirmar) ? (
        <Aviso
          tipo="error"
          texto={`📍 ${zonas.filter(porConfirmar).length} zona(s) sin ubicación confirmada (pin gris "?" en el mapa): ${zonas
            .filter(porConfirmar).map(z => z.nombre).join(', ')}. Ve al lugar, toca "✏️ Editar" y luego "📍 Usar mi ubicación".`}
        />
      ) : null}

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
              <BotonChico texto="Registrar recolección" color={colores.tierra} onPress={() => setRecolectando(j.id)} />
            </View>
          </Tarjeta>
        );
      })}

      <ListaDesplegable titulo="Zonas de poda" vacio="Todavía no hay zonas de poda.">
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
              {gestiona ? (
                <>
                  <BotonChico texto="✏️ Editar" onPress={() => setEditandoZona(z.id)} />
                  <BotonChico texto="Generar jornadas" color={colores.azul} onPress={() => generar(z)} />
                  {esAdmin ? <BotonChico texto="🗑️ Eliminar" color={colores.rojo} onPress={() => eliminarZona(z)} /> : null}
                </>
              ) : null}
            </View>
          </Tarjeta>
        ))}
      </ListaDesplegable>

      {gestiona ? (
      <View style={styles.acciones}>
        <BotonChico texto="+ Nueva zona" relleno onPress={() => setFormulario('zona')} />
        <BotonChico texto="+ Jornada puntual" onPress={() => setFormulario('jornada')} />
      </View>
      ) : null}

      {formulario === 'zona' ? <FormZona puntos={puntos} onListo={terminar} onCancelar={() => setFormulario(null)} /> : null}
      {formulario === 'jornada' ? <NuevaJornada zonas={zonas} onListo={terminar} onCerrar={() => setFormulario(null)} /> : null}
      {zonaEditada ? (
        <FormZona zona={zonaEditada} puntos={puntos} onListo={terminar} onCancelar={() => setEditandoZona(null)} />
      ) : null}
      {jornadaRecolectada ? (
        <RecoleccionJornada jornada={jornadaRecolectada} puntos={puntos} onListo={terminar} onCerrar={() => setRecolectando(null)} />
      ) : null}
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
  fila: { flexDirection: 'row', gap: 8 },
  contexto: { fontSize: 14, color: colores.verde, fontWeight: '600', marginBottom: 12 },
});
