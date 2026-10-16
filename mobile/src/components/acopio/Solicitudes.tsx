import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { obtenerUbicacion } from '@/lib/gps';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { EstadoSolicitud, Municipio, Solicitud } from '@/lib/types';
import Mapa from '@/components/Mapa';
import { Aviso, Boton, BotonChico, Campo, colores, fecha, Opciones, Seccion, Tarjeta } from '@/components/ui';
import { alerta } from '@/lib/alerta';

const MUNICIPIOS: Municipio[] = ['Jiquilpan', 'Sahuayo', 'Otro'];
const COLOR_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente: 'red',
  asignada: 'yellow',
  recolectada: 'green',
  cancelada: 'gray',
};
const ETIQUETA_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente: '🔴 Pendiente',
  asignada: '🟡 Asignada',
  recolectada: '🟢 Recolectada',
  cancelada: '⚪ Cancelada',
};

function CerrarSolicitud({ solicitud, puntos, onListo }: {
  solicitud: Solicitud; puntos: { id: string; nombre: string }[]; onListo: () => void;
}) {
  const { usuario } = useUsuario();
  const [kg, setKg] = useState(solicitud.kgEstimados ? String(solicitud.kgEstimados) : '');
  const [puntoId, setPuntoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (!puntoId) return alerta('Falta dato', 'Elige a qué punto de acopio se llevó');
    setEnviando(true);
    try {
      await api.cambiarEstadoSolicitud(solicitud.id, {
        estado: 'recolectada', kgReales: Number(kg), puntoId, recolectorId: usuario?.id,
      });
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.subform}>
      <Campo etiqueta="Kg reales recolectados" value={kg} onChangeText={setKg} keyboardType="decimal-pad" />
      <Opciones
        etiqueta="Se llevó al punto"
        opciones={puntos.map(p => p.id)}
        nombres={Object.fromEntries(puntos.map(p => [p.id, p.nombre]))}
        valor={puntoId}
        onChange={setPuntoId}
      />
      <Boton texto="Confirmar recolección" color={colores.tierra} onPress={guardar} cargando={enviando} />
    </View>
  );
}

export default function Solicitudes() {
  const { usuario } = useUsuario();
  const { data, error, recargar } = useData(async () => {
    const [solicitudes, puntos] = await Promise.all([api.solicitudes(), api.puntosAcopio()]);
    return { solicitudes, puntos };
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [contacto, setContacto] = useState('');
  const [direccion, setDireccion] = useState('');
  const [municipio, setMunicipio] = useState<Municipio | null>('Jiquilpan');
  const [kg, setKg] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cerrando, setCerrando] = useState<string | null>(null);
  const [verCerradas, setVerCerradas] = useState(false);

  const solicitudes = data?.solicitudes ?? [];
  const puntos = data?.puntos ?? [];
  const abiertas = solicitudes.filter(s => s.estado === 'pendiente' || s.estado === 'asignada');
  const visibles = verCerradas ? solicitudes : abiertas;

  const enviar = async () => {
    if (!coords) return alerta('Falta ubicación', 'Toca "Tomar mi ubicación" donde está la poda.');
    setEnviando(true);
    try {
      await api.crearSolicitud({
        nombre, contacto, direccion, municipio: municipio ?? undefined,
        lat: coords.lat, lng: coords.lng, kgEstimados: kg ? Number(kg) : undefined, notas, usuarioId: usuario?.id,
      });
      setDireccion('');
      setKg('');
      setNotas('');
      setCoords(null);
      alerta('Solicitud enviada', 'Un voluntario pasará a recoger la poda.');
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const cambiar = async (s: Solicitud, estado: EstadoSolicitud) => {
    try {
      await api.cambiarEstadoSolicitud(s.id, { estado, recolectorId: usuario?.id });
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    }
  };

  const abrirMapa = (s: Solicitud) =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`);

  return (
    <>
      {error ? <Aviso texto={error} /> : null}
      <Mapa
        puntos={abiertas.map(s => ({
          id: s.id, lat: s.lat, lng: s.lng, titulo: s.direccion,
          descripcion: `${s.kgEstimados ?? '?'} kg · ${s.estado}`, color: COLOR_ESTADO[s.estado],
        }))}
      />
      <Text style={styles.leyenda}>🔴 Pendiente   🟡 Asignada a un voluntario</Text>

      <Seccion>Solicitudes ({abiertas.length} abiertas)</Seccion>
      <BotonChico texto={verCerradas ? 'Ver solo abiertas' : 'Ver todas'} onPress={() => setVerCerradas(!verCerradas)} />
      {[...visibles].reverse().map(s => (
        <Tarjeta key={s.id} style={{ marginTop: 8 }}>
          <Text style={styles.estado}>{ETIQUETA_ESTADO[s.estado]}</Text>
          <Text style={styles.nombre}>{s.direccion}</Text>
          <Text style={styles.detalle}>
            {s.nombre}{s.contacto ? ` · ${s.contacto}` : ''} · {s.kgEstimados ?? '?'} kg aprox. · {fecha(s.creadoEn)}
          </Text>
          {s.kgReales ? <Text style={styles.detalle}>Recolectado: {s.kgReales} kg</Text> : null}
          {s.notas ? <Text style={styles.detalle}>{s.notas}</Text> : null}
          <View style={styles.acciones}>
            <BotonChico texto="🗺️ Cómo llegar" color={colores.azul} onPress={() => abrirMapa(s)} />
            {s.estado === 'pendiente' ? <BotonChico texto="Yo voy" onPress={() => cambiar(s, 'asignada')} /> : null}
            {s.estado === 'asignada' ? (
              <>
                <BotonChico texto="Ya la recogí" color={colores.tierra} onPress={() => setCerrando(cerrando === s.id ? null : s.id)} />
                <BotonChico texto="Liberar" color={colores.textoSuave} onPress={() => cambiar(s, 'pendiente')} />
              </>
            ) : null}
            {s.estado === 'pendiente' || s.estado === 'asignada' ? (
              <BotonChico texto="Cancelar" color={colores.rojo} onPress={() => cambiar(s, 'cancelada')} />
            ) : null}
          </View>
          {cerrando === s.id ? (
            <CerrarSolicitud solicitud={s} puntos={puntos} onListo={() => { setCerrando(null); recargar(); }} />
          ) : null}
        </Tarjeta>
      ))}

      <Seccion>Pedir que recojan poda</Seccion>
      <Aviso tipo="info" texto="¿Podaste un ficus en tu casa, negocio o escuela? Pide que pasen por las hojas y ramas." />
      <Boton
        texto={coords ? `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : '📍 Tomar mi ubicación'}
        onPress={async () => setCoords(await obtenerUbicacion('indicar dónde está la poda'))}
        secundario={!!coords}
      />
      <Campo etiqueta="Dirección / referencia" value={direccion} onChangeText={setDireccion} placeholder="Ej: Hidalgo 45, portón verde" />
      <Opciones etiqueta="Municipio" opciones={MUNICIPIOS} valor={municipio} onChange={setMunicipio} />
      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} />
      <Campo etiqueta="Teléfono (opcional)" value={contacto} onChangeText={setContacto} keyboardType="phone-pad" />
      <Campo etiqueta="Kg aproximados" value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="Un costal lleno ≈ 10–15 kg" />
      <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline placeholder="Ej: disponible después de las 4 pm" />
      <Boton texto="Enviar solicitud" color={colores.tierra} onPress={enviar} cargando={enviando} />
    </>
  );
}

const styles = StyleSheet.create({
  leyenda: { fontSize: 12, color: colores.textoSuave, marginBottom: 4 },
  estado: { fontSize: 12, fontWeight: '700', color: colores.texto, marginBottom: 4 },
  nombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap' },
  subform: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
});
