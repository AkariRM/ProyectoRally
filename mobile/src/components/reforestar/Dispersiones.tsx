import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { alerta } from '@/lib/alerta';
import { useData } from '@/lib/useData';
import type { Municipio } from '@/lib/types';
import Mapa from '@/components/Mapa';
import SelectorUbicacion from '@/components/SelectorUbicacion';
import { Aviso, Boton, Campo, colores, fecha, Opciones, Seccion, Tarjeta } from '@/components/ui';

const MUNICIPIOS: Municipio[] = ['Jiquilpan', 'Sahuayo', 'Otro'];

// Registrar dónde se lanzaron píldoras (de preferencia dentro de un área a reforestar)
export default function Dispersiones() {
  const { data, error, recargar } = useData(async () => {
    const [lotes, especies, dispersiones, areas] = await Promise.all([
      api.lotes(), api.especies(), api.dispersiones(), api.areas(),
    ]);
    return { lotes, especies, dispersiones, areas };
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [zona, setZona] = useState('');
  const [municipio, setMunicipio] = useState<Municipio | null>('Jiquilpan');
  const [loteId, setLoteId] = useState<string | null>(null);
  const [especieId, setEspecieId] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const especies = data?.especies ?? [];
  const lotes = data?.lotes ?? [];
  const areas = data?.areas ?? [];
  const nombreEspecie = Object.fromEntries(especies.map(e => [e.id, e.nombreComun]));
  const nombreLote = Object.fromEntries(lotes.map(l => [l.id, `${l.codigo} · ${nombreEspecie[l.especieId] ?? ''}`]));
  const nombreArea = Object.fromEntries(areas.map(a => [a.id, a.nombre]));
  const area = areas.find(a => a.id === areaId);

  const elegirArea = (id: string) => {
    const a = areas.find(x => x.id === id);
    setAreaId(id);
    if (a) {
      setZona(a.nombre);
      if (a.municipio) setMunicipio(a.municipio);
    }
  };

  const elegirLote = (id: string) => {
    setLoteId(id);
    setEspecieId(null);
  };

  const enviar = async () => {
    // Sin GPS se usa el centro del área elegida
    const ubicacion = coords ?? (area ? { lat: area.lat, lng: area.lng } : null);
    if (!ubicacion) return alerta('Falta ubicación', 'Marca el lugar en el mapa, usa tu ubicación o elige un área.');
    setEnviando(true);
    try {
      await api.crearDispersion({
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        zona,
        areaId: areaId ?? undefined,
        municipio: municipio ?? undefined,
        loteId: loteId ?? undefined,
        especieId: especieId ?? undefined,
        cantidad: Number(cantidad),
        notas,
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
    <>
      {error ? <Aviso texto={error} /> : null}
      <Mapa
        puntos={(data?.dispersiones ?? []).map(d => ({
          id: d.id, lat: d.lat, lng: d.lng, titulo: d.zona, descripcion: `${d.cantidad} píldoras`, color: 'green',
        }))}
      />

      <Seccion>Nueva dispersión</Seccion>
      {areas.length ? (
        <Opciones etiqueta="Área a reforestar" opciones={areas.map(a => a.id)} nombres={nombreArea} valor={areaId} onChange={elegirArea} />
      ) : null}
      <SelectorUbicacion
        etiqueta={area && !coords ? 'Dónde se lanzaron (si no marcas, se usa el centro del área)' : 'Dónde se lanzaron'}
        valor={coords}
        onChange={setCoords}
        motivo="registrar dónde lanzaste las píldoras"
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
      {data?.dispersiones.length ? <Text style={styles.ayuda}>Toca una dispersión para registrar su seguimiento.</Text> : null}
      {[...(data?.dispersiones ?? [])].reverse().map(d => (
        <TouchableOpacity key={d.id} onPress={() => router.push({ pathname: '/seguimiento/[id]', params: { id: d.id } })}>
          <Tarjeta>
            <Text style={styles.nombre}>{d.zona}</Text>
            <Text style={styles.detalle}>
              {d.cantidad} píldoras · {nombreEspecie[d.especieId ?? ''] ?? 'sin especie'} · {fecha(d.creadoEn)}
              {d.areaId ? ` · área: ${nombreArea[d.areaId] ?? '—'}` : ''}
            </Text>
            <Text style={styles.link}>Registrar seguimiento ›</Text>
          </Tarjeta>
        </TouchableOpacity>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  ayuda: { fontSize: 12, color: colores.textoSuave, marginBottom: 8 },
  nombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  link: { fontSize: 13, color: colores.verde, marginTop: 6, fontWeight: '600' },
});
