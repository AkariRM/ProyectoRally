import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { alerta, confirmar } from '@/lib/alerta';
import { actualizarAvisos, pedirPermiso } from '@/lib/avisos';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { AreaReforestacion, Especie, JornadaReforestacion, Lote } from '@/lib/types';
import {
  aYyyyMmDd, Aviso, Boton, BotonChico, Campo, colores, fechaCorta, Opciones, OpcionesMultiples, Seccion, Tarjeta,
} from '@/components/ui';

function NuevaJornada({ areas, onListo, onCancelar }: { areas: AreaReforestacion[]; onListo: () => void; onCancelar: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [areaId, setAreaId] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [horaInicio, setHoraInicio] = useState('07:00');
  const [horaFin, setHoraFin] = useState('12:00');
  const [puntoReunion, setPuntoReunion] = useState('');
  const [cupo, setCupo] = useState('');
  const [meta, setMeta] = useState('');
  const [organiza, setOrganiza] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

  const dias = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return aYyyyMmDd(d);
  });

  const guardar = async () => {
    if (!areaId || !fecha) return alerta('Faltan datos', 'Elige el área y la fecha.');
    setEnviando(true);
    try {
      await api.crearJornadaReforestacion({
        titulo, areaId, fecha, horaInicio, horaFin, puntoReunion,
        cupo: cupo ? Number(cupo) : undefined, pildorasMeta: meta ? Number(meta) : undefined,
        organiza, descripcion,
      });
      alerta('Jornada convocada', 'Los voluntarios ya pueden inscribirse.');
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta style={{ marginTop: 8 }}>
      <Text style={styles.formTitulo}>Convocar jornada de reforestación</Text>
      <Campo etiqueta="Título" value={titulo} onChangeText={setTitulo} placeholder="Ej: Reforestación Cerro de San Francisco" />
      <Opciones etiqueta="Área" opciones={areas.map(a => a.id)} nombres={Object.fromEntries(areas.map(a => [a.id, a.nombre]))} valor={areaId} onChange={setAreaId} />
      <Opciones etiqueta="Fecha" opciones={dias} nombres={Object.fromEntries(dias.map(d => [d, fechaCorta(d)]))} valor={fecha} onChange={setFecha} />
      <View style={styles.fila}>
        <View style={{ flex: 1 }}><Campo etiqueta="Desde (HH:MM)" value={horaInicio} onChangeText={setHoraInicio} /></View>
        <View style={{ flex: 1 }}><Campo etiqueta="Hasta (HH:MM)" value={horaFin} onChangeText={setHoraFin} /></View>
      </View>
      <Campo etiqueta="Punto de reunión" value={puntoReunion} onChangeText={setPuntoReunion} placeholder="Ej: Entrada del Bosque Cuauhtémoc" />
      <View style={styles.fila}>
        <View style={{ flex: 1 }}><Campo etiqueta="Cupo (opcional)" value={cupo} onChangeText={setCupo} keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Campo etiqueta="Meta de píldoras" value={meta} onChangeText={setMeta} keyboardType="number-pad" /></View>
      </View>
      <Campo etiqueta="Organiza" value={organiza} onChangeText={setOrganiza} placeholder="Ej: Ayuntamiento, brigada comunitaria, ITJ" />
      <Campo etiqueta="Descripción" value={descripcion} onChangeText={setDescripcion} multiline placeholder="Qué llevar: agua, gorra, guantes…" />
      <Boton texto="Convocar" onPress={guardar} cargando={enviando} />
      <Boton texto="Cancelar" onPress={onCancelar} secundario color={colores.textoSuave} />
    </Tarjeta>
  );
}

// Pasar lista y registrar cuántas píldoras se sembraron
function CerrarJornada({ jornada, lotes, especies, onListo }: {
  jornada: JornadaReforestacion; lotes: Lote[]; especies: Especie[]; onListo: () => void;
}) {
  const { data: inscritos } = useData(() => api.inscritos(jornada.id));
  const [asistentes, setAsistentes] = useState<string[]>([]);
  const [pildoras, setPildoras] = useState('');
  const [loteId, setLoteId] = useState<string | null>(null);
  const [especieId, setEspecieId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const nombreEspecie = Object.fromEntries(especies.map(e => [e.id, e.nombreComun]));

  const guardar = async () => {
    setEnviando(true);
    try {
      await api.cerrarJornadaReforestacion(jornada.id, {
        estado: 'realizada', asistentes, pildorasDispersadas: pildoras ? Number(pildoras) : 0,
        loteId: loteId ?? undefined, especieId: especieId ?? undefined,
      });
      alerta('Jornada cerrada', 'La siembra quedó registrada como dispersión para su seguimiento.');
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.subform}>
      <OpcionesMultiples
        etiqueta={`Asistencia (${asistentes.length} de ${inscritos?.length ?? 0} inscritos)`}
        opciones={(inscritos ?? []).map(u => u.id)}
        nombres={Object.fromEntries((inscritos ?? []).map(u => [u.id, u.email]))}
        valores={asistentes}
        onChange={setAsistentes}
      />
      <Campo etiqueta="Píldoras sembradas" value={pildoras} onChangeText={setPildoras} keyboardType="number-pad" />
      {lotes.length ? (
        <Opciones
          etiqueta="Lote"
          opciones={lotes.map(l => l.id)}
          nombres={Object.fromEntries(lotes.map(l => [l.id, `${l.codigo} · ${nombreEspecie[l.especieId] ?? ''}`]))}
          valor={loteId}
          onChange={id => { setLoteId(id); setEspecieId(null); }}
        />
      ) : null}
      {!loteId ? (
        <Opciones etiqueta="Especie (si no hay lote)" opciones={especies.map(e => e.id)} nombres={nombreEspecie} valor={especieId} onChange={setEspecieId} />
      ) : null}
      <Boton texto="Cerrar jornada como realizada" onPress={guardar} cargando={enviando} />
    </View>
  );
}

export default function Jornadas() {
  const { usuario, puede } = useUsuario();
  const gestiona = puede('brigadista');
  const { data, error, recargar } = useData(async () => {
    const [proximas, todas, areas, lotes, especies] = await Promise.all([
      api.jornadasReforestacionProximas(), api.jornadasReforestacion(), api.areas(), api.lotes(), api.especies(),
    ]);
    return { proximas, todas, areas, lotes, especies };
  });
  const [nueva, setNueva] = useState(false);
  const [cerrando, setCerrando] = useState<string | null>(null);

  const areas = data?.areas ?? [];
  const realizadas = (data?.todas ?? []).filter(j => j.estado === 'realizada').reverse();

  const inscribirme = async (j: JornadaReforestacion) => {
    if (!usuario) return;
    const inscribiendo = !j.inscritos.includes(usuario.id);
    try {
      await api.inscribirme(j.id, !inscribiendo);
      if (inscribiendo) await pedirPermiso().catch(() => false);
      actualizarAvisos(usuario.id).catch(() => {});
      recargar();
    } catch (e) {
      alerta('No se pudo', (e as Error).message);
    }
  };

  const cancelar = async (j: JornadaReforestacion) => {
    if (!(await confirmar('Cancelar jornada', `¿Cancelar "${j.titulo}"?`, 'Cancelar jornada'))) return;
    try {
      await api.cerrarJornadaReforestacion(j.id, { estado: 'cancelada' });
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    }
  };

  const terminar = () => {
    setNueva(false);
    setCerrando(null);
    recargar();
  };

  return (
    <>
      {error ? <Aviso texto={error} /> : null}
      <Aviso tipo="info" texto="Al inscribirte recibirás un aviso el día anterior y 1 hora antes (en el celular)." />

      <Seccion>Próximas jornadas de reforestación</Seccion>
      {!data?.proximas.length ? <Text style={styles.detalle}>No hay jornadas convocadas.</Text> : null}
      {(data?.proximas ?? []).map(j => {
        const inscrito = !!usuario && j.inscritos.includes(usuario.id);
        const llena = !!j.cupo && j.inscritos.length >= j.cupo && !inscrito;
        return (
          <Tarjeta key={j.id}>
            <Text style={styles.nombre}>{j.titulo}</Text>
            <Text style={styles.zona}>{fechaCorta(j.fecha)} · {j.horaInicio ?? ''}{j.horaFin ? `–${j.horaFin}` : ''} · {j.area?.nombre ?? ''}</Text>
            {j.puntoReunion ? <Text style={styles.detalle}>Reunión: {j.puntoReunion}</Text> : null}
            <Text style={styles.detalle}>
              {j.inscritos.length}{j.cupo ? ` / ${j.cupo}` : ''} inscritos{j.pildorasMeta ? ` · meta ${j.pildorasMeta} píldoras` : ''}
              {j.organiza ? ` · organiza ${j.organiza}` : ''}
            </Text>
            {j.descripcion ? <Text style={styles.detalle}>{j.descripcion}</Text> : null}
            <View style={styles.acciones}>
              {llena ? <Text style={styles.llena}>Cupo lleno</Text> : (
                <BotonChico texto={inscrito ? '✓ Inscrito' : 'Inscribirme'} relleno={inscrito} onPress={() => inscribirme(j)} />
              )}
              {gestiona ? (
                <>
                  <BotonChico texto="Pasar lista y cerrar" color={colores.azul} onPress={() => setCerrando(cerrando === j.id ? null : j.id)} />
                  <BotonChico texto="Cancelar" color={colores.rojo} onPress={() => cancelar(j)} />
                </>
              ) : null}
            </View>
            {cerrando === j.id ? (
              <CerrarJornada jornada={j} lotes={data?.lotes ?? []} especies={data?.especies ?? []} onListo={terminar} />
            ) : null}
          </Tarjeta>
        );
      })}

      {gestiona ? (
        nueva ? <NuevaJornada areas={areas} onListo={terminar} onCancelar={() => setNueva(false)} />
          : areas.length ? <BotonChico texto="+ Convocar jornada" relleno onPress={() => setNueva(true)} />
            : <Aviso tipo="info" texto="Primero registra un área a reforestar." />
      ) : null}

      {realizadas.length ? <Seccion>Jornadas realizadas</Seccion> : null}
      {realizadas.map(j => (
        <Tarjeta key={j.id}>
          <Text style={styles.nombre}>✅ {j.titulo}</Text>
          <Text style={styles.detalle}>
            {fechaCorta(j.fecha)} · {areas.find(a => a.id === j.areaId)?.nombre ?? ''} · {j.asistentes.length} asistentes · {j.pildorasDispersadas ?? 0} píldoras
          </Text>
        </Tarjeta>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  nombre: { fontSize: 15, fontWeight: '700', color: colores.texto },
  zona: { fontSize: 13, color: colores.verde, marginTop: 2, fontWeight: '600' },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  llena: { fontSize: 13, color: colores.rojo, marginTop: 10, fontWeight: '600' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  subform: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  fila: { flexDirection: 'row', gap: 8 },
  formTitulo: { fontSize: 16, fontWeight: '700', color: colores.verde, marginBottom: 10 },
});
