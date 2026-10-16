import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { obtenerUbicacion } from '@/lib/gps';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { EstadoSolicitud, Municipio, ParadaRuta, Solicitud, TipoMaterial } from '@/lib/types';
import { nombresDe, useCatalogos } from '@/lib/catalogos';
import Mapa from '@/components/Mapa';
import ModalPasos from '@/components/ModalPasos';
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

// "Ya la recogí": kg reales y punto al que se llevó, en 2 pasos
function CerrarSolicitud({ solicitud, puntos, onListo, onCerrar }: {
  solicitud: Solicitud; puntos: { id: string; nombre: string }[]; onListo: () => void; onCerrar: () => void;
}) {
  const { usuario } = useUsuario();
  const [kg, setKg] = useState(solicitud.kgEstimados ? String(solicitud.kgEstimados) : '');
  const [puntoId, setPuntoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    setEnviando(true);
    try {
      await api.cambiarEstadoSolicitud(solicitud.id, {
        estado: 'recolectada', kgReales: Number(kg), puntoId: puntoId!, recolectorId: usuario?.id,
      });
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalPasos
      titulo="Confirmar recolección"
      color={colores.tierra}
      onCerrar={onCerrar}
      onFinal={guardar}
      cargando={enviando}
      textoFinal="Confirmar recolección"
      pasos={[
        {
          titulo: 'Cantidad',
          falta: Number(kg) > 0 ? null : 'Escribe los kg que recogiste',
          contenido: (
            <>
              <Text style={styles.contexto}>{solicitud.direccion}</Text>
              <Campo etiqueta="Kg reales recolectados" value={kg} onChangeText={setKg} keyboardType="decimal-pad" />
            </>
          ),
        },
        {
          titulo: 'Destino',
          falta: puntoId ? null : 'Elige a qué punto de acopio se llevó',
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

// Pedir que recojan poda, en 3 pasos: dónde, quién y qué
function NuevaSolicitud({ onListo, onCerrar }: { onListo: () => void; onCerrar: () => void }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [direccion, setDireccion] = useState('');
  const [municipio, setMunicipio] = useState<Municipio | null>('Jiquilpan');
  const [kg, setKg] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState<TipoMaterial | null>(null);
  const { data: catalogos } = useCatalogos();
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setEnviando(true);
    try {
      await api.crearSolicitud({
        nombre, contacto, direccion, municipio: municipio ?? undefined,
        lat: coords!.lat, lng: coords!.lng, kgEstimados: kg ? Number(kg) : undefined, notas,
        tipoMaterial: tipoMaterial ?? undefined,
      });
      alerta('Solicitud enviada', 'Un voluntario pasará a recoger la poda.');
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalPasos
      titulo="Pedir que recojan poda"
      color={colores.tierra}
      onCerrar={onCerrar}
      onFinal={enviar}
      cargando={enviando}
      textoFinal="Enviar solicitud"
      pasos={[
        {
          titulo: 'Dónde',
          falta: coords ? null : 'Toca "Tomar mi ubicación" donde está la poda',
          contenido: (
            <>
              <Aviso tipo="info" texto="¿Podaste un ficus en tu casa, negocio o escuela? Pide que pasen por las hojas y ramas." />
              <Boton
                texto={coords ? `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : '📍 Tomar mi ubicación'}
                onPress={async () => setCoords(await obtenerUbicacion('indicar dónde está la poda'))}
                secundario={!!coords}
              />
              <Campo etiqueta="Dirección / referencia" value={direccion} onChangeText={setDireccion} placeholder="Ej: Hidalgo 45, portón verde" />
              <Opciones etiqueta="Municipio" opciones={MUNICIPIOS} valor={municipio} onChange={setMunicipio} />
            </>
          ),
        },
        {
          titulo: 'Quién',
          contenido: (
            <>
              <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} />
              <Campo etiqueta="Teléfono (opcional)" value={contacto} onChangeText={setContacto} keyboardType="phone-pad" />
            </>
          ),
        },
        {
          titulo: 'Qué hay',
          contenido: (
            <>
              <Opciones
                etiqueta="Tipo de material"
                opciones={(catalogos?.tiposMaterial ?? []).map(t => t.id)}
                nombres={nombresDe(catalogos?.tiposMaterial)}
                valor={tipoMaterial}
                onChange={setTipoMaterial}
              />
              <Campo etiqueta="Kg aproximados" value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="Un costal lleno ≈ 10–15 kg" />
              <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline placeholder="Ej: disponible después de las 4 pm" />
            </>
          ),
        },
      ]}
    />
  );
}

export default function Solicitudes() {
  const { usuario } = useUsuario();
  const { data, error, recargar } = useData(async () => {
    const [solicitudes, puntos] = await Promise.all([api.solicitudes(), api.puntosAcopio()]);
    return { solicitudes, puntos };
  });

  const [ruta, setRuta] = useState<{ paradas: ParadaRuta[]; totalKm: number; googleMapsUrl: string | null } | null>(null);
  const [destinoRuta, setDestinoRuta] = useState<string | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [cerrando, setCerrando] = useState<string | null>(null);
  const [pidiendo, setPidiendo] = useState(false);
  const [verCerradas, setVerCerradas] = useState(false);

  const solicitudes = data?.solicitudes ?? [];
  const puntos = data?.puntos ?? [];
  const abiertas = solicitudes.filter(s => s.estado === 'pendiente' || s.estado === 'asignada');
  const visibles = verCerradas ? solicitudes : abiertas;
  const solicitudCerrando = solicitudes.find(s => s.id === cerrando);

  const cambiar = async (s: Solicitud, estado: EstadoSolicitud) => {
    try {
      await api.cambiarEstadoSolicitud(s.id, { estado, recolectorId: usuario?.id });
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    }
  };

  const calcularRuta = async () => {
    setCalculando(true);
    const c = await obtenerUbicacion('calcular la ruta desde donde estás');
    if (c) {
      try {
        setRuta(await api.ruta(c.lat, c.lng, destinoRuta ?? undefined));
      } catch (e) {
        alerta('Error', (e as Error).message);
      }
    }
    setCalculando(false);
  };

  const terminar = () => {
    setCerrando(null);
    setPidiendo(false);
    recargar();
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

      <Boton texto="➕ Pedir que recojan poda" color={colores.tierra} onPress={() => setPidiendo(true)} />

      <Seccion>🧭 Ruta sugerida de recolección</Seccion>
      <Text style={styles.detalle}>Ordena las solicitudes abiertas y las podas de hoy por cercanía desde tu ubicación.</Text>
      <Opciones
        etiqueta="Terminar en el punto de acopio (opcional)"
        opciones={puntos.map(p => p.id)}
        nombres={Object.fromEntries(puntos.map(p => [p.id, p.nombre]))}
        valor={destinoRuta}
        onChange={setDestinoRuta}
      />
      <Boton texto="Calcular ruta" color={colores.azul} onPress={calcularRuta} cargando={calculando} secundario />
      {ruta ? (
        <Tarjeta>
          {!ruta.paradas.length ? <Text style={styles.detalle}>No hay paradas pendientes.</Text> : null}
          {ruta.paradas.map((p, i) => (
            <Text key={`${p.tipo}-${p.id}`} style={styles.parada}>
              {i + 1}. {p.tipo === 'acopio' ? '📍' : p.tipo === 'jornada' ? '✂️' : '🏠'} {p.nombre}
              <Text style={styles.detalle}>  {p.detalle} · {p.km} km</Text>
            </Text>
          ))}
          {ruta.paradas.length ? <Text style={styles.total}>Total aprox.: {ruta.totalKm} km en línea recta</Text> : null}
          {ruta.googleMapsUrl ? (
            <BotonChico texto="Abrir ruta en Google Maps" color={colores.azul} onPress={() => Linking.openURL(ruta.googleMapsUrl!)} />
          ) : null}
        </Tarjeta>
      ) : null}

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
                <BotonChico texto="Ya la recogí" color={colores.tierra} onPress={() => setCerrando(s.id)} />
                <BotonChico texto="Liberar" color={colores.textoSuave} onPress={() => cambiar(s, 'pendiente')} />
              </>
            ) : null}
            {s.estado === 'pendiente' || s.estado === 'asignada' ? (
              <BotonChico texto="Cancelar" color={colores.rojo} onPress={() => cambiar(s, 'cancelada')} />
            ) : null}
          </View>
        </Tarjeta>
      ))}

      {pidiendo ? <NuevaSolicitud onListo={terminar} onCerrar={() => setPidiendo(false)} /> : null}
      {solicitudCerrando ? (
        <CerrarSolicitud solicitud={solicitudCerrando} puntos={puntos} onListo={terminar} onCerrar={() => setCerrando(null)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  leyenda: { fontSize: 12, color: colores.textoSuave, marginBottom: 4 },
  estado: { fontSize: 12, fontWeight: '700', color: colores.texto, marginBottom: 4 },
  nombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap' },
  parada: { fontSize: 14, color: colores.texto, marginBottom: 6 },
  total: { fontSize: 13, fontWeight: '700', color: colores.azul, marginTop: 4 },
  contexto: { fontSize: 14, color: colores.tierra, fontWeight: '600', marginBottom: 12 },
});
