import { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { obtenerUbicacion } from '@/lib/gps';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Municipio } from '@/lib/types';
import { Aviso, Boton, Campo, colores, fecha, Opciones, Pantalla, Seccion, Tarjeta } from '@/components/ui';
import { alerta } from '@/lib/alerta';

const MUNICIPIOS: Municipio[] = ['Jiquilpan', 'Sahuayo', 'Otro'];

export default function Dispersar() {
  const { usuario } = useUsuario();
  const { data, error, recargar } = useData(async () => {
    const [lotes, especies, dispersiones] = await Promise.all([api.lotes(), api.especies(), api.dispersiones()]);
    return { lotes, especies, dispersiones };
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [zona, setZona] = useState('');
  const [municipio, setMunicipio] = useState<Municipio | null>('Jiquilpan');
  const [loteId, setLoteId] = useState<string | null>(null);
  const [especieId, setEspecieId] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const especies = data?.especies ?? [];
  const lotes = data?.lotes ?? [];
  const nombreEspecie = Object.fromEntries(especies.map(e => [e.id, e.nombreComun]));
  const nombreLote = Object.fromEntries(lotes.map(l => [l.id, `${l.codigo} · ${nombreEspecie[l.especieId] ?? ''}`]));

  const tomarUbicacion = async () => {
    setBuscandoGps(true);
    const ubicacion = await obtenerUbicacion('registrar dónde lanzaste las píldoras');
    if (ubicacion) setCoords(ubicacion);
    setBuscandoGps(false);
  };

  const elegirLote = (id: string) => {
    setLoteId(id);
    setEspecieId(null);
  };

  const enviar = async () => {
    if (!coords) return alerta('Falta ubicación', 'Toca "Tomar mi ubicación" primero.');
    setEnviando(true);
    try {
      await api.crearDispersion({
        lat: coords.lat,
        lng: coords.lng,
        zona,
        municipio: municipio ?? undefined,
        loteId: loteId ?? undefined,
        especieId: especieId ?? undefined,
        cantidad: Number(cantidad),
        notas,
        usuarioId: usuario?.id,
      });
      setCantidad('');
      setNotas('');
      alerta('¡Listo!', 'Dispersión registrada. Regresa en 2–4 semanas a registrar el seguimiento.');
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla titulo="Dispersar píldoras 🌱" subtitulo="Registra dónde lanzaste las píldoras para darles seguimiento">
      {error ? <Aviso texto={error} /> : null}

      <Seccion>Nueva dispersión</Seccion>
      <Boton
        texto={coords ? `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : '📍 Tomar mi ubicación'}
        onPress={tomarUbicacion}
        cargando={buscandoGps}
        secundario={!!coords}
      />
      <Campo etiqueta="Zona o paraje" value={zona} onChangeText={setZona} placeholder="Ej: Cerro de San Francisco, ladera norte" />
      <Opciones etiqueta="Municipio" opciones={MUNICIPIOS} valor={municipio} onChange={setMunicipio} />
      {lotes.length ? (
        <Opciones etiqueta="Lote de píldoras" opciones={lotes.map(l => l.id)} nombres={nombreLote} valor={loteId} onChange={elegirLote} />
      ) : null}
      {!loteId ? (
        <Opciones etiqueta="Especie (si no hay lote)" opciones={especies.map(e => e.id)} nombres={nombreEspecie} valor={especieId} onChange={setEspecieId} />
      ) : null}
      <Campo etiqueta="Número de píldoras" value={cantidad} onChangeText={setCantidad} keyboardType="number-pad" placeholder="Ej: 50" />
      <Campo etiqueta="Notas (opcional)" value={notas} onChangeText={setNotas} multiline placeholder="Ej: suelo compactado, pendiente fuerte, llovió ayer" />
      <Boton texto="Registrar dispersión" onPress={enviar} cargando={enviando} />

      {data?.dispersiones.length ? <Seccion>Dispersiones registradas</Seccion> : null}
      <Text style={styles.ayuda}>Toca una dispersión para registrar su seguimiento.</Text>
      {[...(data?.dispersiones ?? [])].reverse().map(d => (
        <TouchableOpacity key={d.id} onPress={() => router.push({ pathname: '/seguimiento/[id]', params: { id: d.id } })}>
          <Tarjeta>
            <Text style={styles.nombre}>{d.zona}</Text>
            <Text style={styles.detalle}>
              {d.cantidad} píldoras · {nombreEspecie[d.especieId ?? ''] ?? 'sin especie'} · {fecha(d.creadoEn)}
            </Text>
            <Text style={styles.link}>Registrar seguimiento ›</Text>
          </Tarjeta>
        </TouchableOpacity>
      ))}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  ayuda: { fontSize: 12, color: colores.textoSuave, marginBottom: 8 },
  nombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  link: { fontSize: 13, color: colores.verde, marginTop: 6, fontWeight: '600' },
});
