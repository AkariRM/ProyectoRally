import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { alerta, confirmar } from '@/lib/alerta';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { AreaReforestacion, Especie, EstadoArea, Municipio, Riesgo } from '@/lib/types';
import Mapa from '@/components/Mapa';
import SelectorZona from '@/components/SelectorZona';
import { areaM2, centroYRadio, esPoligono, type Poligono } from '@/lib/geo';
import {
  Aviso, Boton, BotonChico, Campo, colores, Opciones, OpcionesMultiples, Seccion, Tarjeta,
} from '@/components/ui';

const MUNICIPIOS: Municipio[] = ['Jiquilpan', 'Sahuayo', 'Otro'];
const RIESGOS: Riesgo[] = ['alto', 'medio', 'bajo'];
const ESTADOS: EstadoArea[] = ['quemada', 'degradada', 'en reforestación', 'recuperada'];

export const COLOR_ESTADO: Record<EstadoArea, string> = {
  quemada: '#C62828',
  degradada: '#EF6C00',
  'en reforestación': '#1565C0',
  recuperada: '#2E7D32',
};
const EMOJI_ESTADO: Record<EstadoArea, string> = {
  quemada: '🔥',
  degradada: '🟠',
  'en reforestación': '🌱',
  recuperada: '🌳',
};

function FormArea({ area, especies, onListo, onCancelar }: {
  area?: AreaReforestacion; especies: Especie[]; onListo: () => void; onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(area?.nombre ?? '');
  const [municipio, setMunicipio] = useState<Municipio | null>(area?.municipio ?? 'Jiquilpan');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(area ? { lat: area.lat, lng: area.lng } : null);
  const [lat, setLat] = useState(area ? String(area.lat) : '');
  const [lng, setLng] = useState(area ? String(area.lng) : '');
  const [radio, setRadio] = useState(String(area?.radioM ?? 300));
  const [poligono, setPoligono] = useState<Poligono>(area?.poligono ?? []);
  const [riesgo, setRiesgo] = useState<Riesgo | null>(area?.riesgoIncendio ?? 'alto');
  const [estado, setEstado] = useState<EstadoArea | null>(area?.estado ?? 'quemada');
  const [fechaIncendio, setFechaIncendio] = useState(area?.fechaIncendio ?? '');
  const [hectareas, setHectareas] = useState(area?.hectareas !== undefined ? String(area.hectareas) : '');
  const [recomendadas, setRecomendadas] = useState<string[]>(area?.especiesRecomendadas ?? []);
  const [notas, setNotas] = useState(area?.notas ?? '');
  const [enviando, setEnviando] = useState(false);

  const ponerCoords = (c: { lat: number; lng: number }) => {
    setCoords(c);
    setLat(c.lat.toFixed(6));
    setLng(c.lng.toFixed(6));
  };
  const valorMapa = lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng)) ? { lat: Number(lat), lng: Number(lng) } : coords;

  // Al dibujar el área se calculan sus hectáreas
  const cambiarPoligono = (p: Poligono) => {
    setPoligono(p);
    if (esPoligono(p)) setHectareas((areaM2(p) / 10000).toFixed(2));
  };

  const guardar = async () => {
    const ubic = lat && lng ? { lat: Number(lat), lng: Number(lng) } : coords;
    if (!ubic && !esPoligono(poligono)) return alerta('Falta ubicación', 'Marca o dibuja el área en el mapa, usa tu ubicación o escribe latitud y longitud.');
    setEnviando(true);
    // Con polígono dibujado, el centro y el radio se calculan para que lo cubran
    const ubicacion = esPoligono(poligono)
      ? { ...centroYRadio(poligono), poligono }
      : { lat: ubic!.lat, lng: ubic!.lng, radioM: Number(radio), poligono: area?.poligono?.length ? [] : undefined };
    const datos: Partial<AreaReforestacion> = {
      nombre, municipio: municipio ?? undefined, ...ubicacion,
      riesgoIncendio: riesgo ?? undefined, estado: estado ?? undefined,
      fechaIncendio: fechaIncendio || undefined, hectareas: hectareas ? Number(hectareas) : undefined,
      especiesRecomendadas: recomendadas, notas,
    };
    try {
      if (area) await api.editarArea(area.id, datos);
      else await api.crearArea(datos);
      alerta('Guardado', area ? 'Área actualizada.' : 'Área a reforestar creada.');
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta style={{ marginTop: 8 }}>
      <Text style={styles.formTitulo}>{area ? `Editar: ${area.nombre}` : 'Nueva área a reforestar'}</Text>
      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} placeholder="Ej: Cerro de San Francisco, ladera norte" />
      <Opciones etiqueta="Municipio" opciones={MUNICIPIOS} valor={municipio} onChange={setMunicipio} />
      <SelectorZona
        centro={valorMapa}
        radioM={Number(radio) || 0}
        poligono={poligono}
        onCentro={ponerCoords}
        onPoligono={cambiarPoligono}
        motivo="ubicar el área"
      />
      {!esPoligono(poligono) ? (
        <View style={styles.fila}>
          <View style={{ flex: 1 }}><Campo etiqueta="Latitud" value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" placeholder="19.98" /></View>
          <View style={{ flex: 1 }}><Campo etiqueta="Longitud" value={lng} onChangeText={setLng} keyboardType="numbers-and-punctuation" placeholder="-102.73" /></View>
        </View>
      ) : null}
      <View style={styles.fila}>
        {!esPoligono(poligono) ? (
          <View style={{ flex: 1 }}><Campo etiqueta="Radio (m)" value={radio} onChangeText={setRadio} keyboardType="number-pad" /></View>
        ) : null}
        <View style={{ flex: 1 }}><Campo etiqueta="Hectáreas" value={hectareas} onChangeText={setHectareas} keyboardType="decimal-pad" /></View>
      </View>
      <Opciones etiqueta="Riesgo de incendio" opciones={RIESGOS} valor={riesgo} onChange={setRiesgo} />
      <Opciones etiqueta="Estado" opciones={ESTADOS} valor={estado} onChange={setEstado} />
      <Campo etiqueta="Fecha del incendio (AAAA-MM-DD, opcional)" value={fechaIncendio} onChangeText={setFechaIncendio} placeholder="2026-03-15" />
      <OpcionesMultiples
        etiqueta="Especies recomendadas"
        opciones={especies.map(e => e.id)}
        nombres={Object.fromEntries(especies.map(e => [e.id, e.nombreComun]))}
        valores={recomendadas}
        onChange={setRecomendadas}
      />
      <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline placeholder="Pendiente, acceso, tipo de suelo…" />
      <Boton texto={area ? 'Guardar cambios' : 'Crear área'} onPress={guardar} cargando={enviando} />
      <Boton texto="Cancelar" onPress={onCancelar} secundario color={colores.textoSuave} />
    </Tarjeta>
  );
}

// Áreas a reforestar (laderas quemadas o degradadas)
export default function Areas() {
  const { esAdmin, puede } = useUsuario();
  const gestiona = puede('brigadista');
  const { data, error, recargar } = useData(async () => {
    const [areas, especies, stats] = await Promise.all([api.areas(), api.especies(), api.stats()]);
    return { areas, especies, stats };
  });
  const [editando, setEditando] = useState<string | 'nueva' | null>(null);

  const areas = data?.areas ?? [];
  const especies = data?.especies ?? [];
  const nombreEspecie = Object.fromEntries(especies.map(e => [e.id, e.nombreComun]));
  const resumen = Object.fromEntries((data?.stats.porArea ?? []).map(r => [r.areaId, r]));

  const eliminar = async (a: AreaReforestacion) => {
    if (!(await confirmar('Eliminar área', `¿Eliminar "${a.nombre}"?`))) return;
    try {
      await api.eliminarArea(a.id);
      recargar();
    } catch (e) {
      alerta('No se pudo eliminar', (e as Error).message);
    }
  };

  const terminar = () => {
    setEditando(null);
    recargar();
  };

  return (
    <>
      {error ? <Aviso texto={error} /> : null}
      <Mapa
        zonas={areas.map(a => ({ id: a.id, lat: a.lat, lng: a.lng, radioM: a.radioM, poligono: a.poligono, color: COLOR_ESTADO[a.estado], titulo: a.nombre }))}
      />
      <Text style={styles.leyenda}>🔥 Quemada   🟠 Degradada   🌱 En reforestación   🌳 Recuperada</Text>

      <Seccion>Áreas a reforestar ({areas.length})</Seccion>
      {!areas.length ? (
        <Aviso tipo="info" texto="Aún no hay áreas. Arquitectura y brigadistas pueden registrar las laderas quemadas o degradadas." />
      ) : null}
      {gestiona && editando !== 'nueva' ? <BotonChico texto="+ Nueva área" relleno onPress={() => setEditando('nueva')} /> : null}
      {editando === 'nueva' ? <FormArea especies={especies} onListo={terminar} onCancelar={() => setEditando(null)} /> : null}

      {areas.map(a => editando === a.id ? (
        <FormArea key={a.id} area={a} especies={especies} onListo={terminar} onCancelar={() => setEditando(null)} />
      ) : (
        <Tarjeta key={a.id} style={{ marginTop: 8 }}>
          <Text style={styles.nombre}>{EMOJI_ESTADO[a.estado]} {a.nombre}</Text>
          <Text style={styles.detalle}>
            {a.estado} · riesgo {a.riesgoIncendio}{a.hectareas !== undefined ? ` · ${a.hectareas} ha` : ''}
            {a.fechaIncendio ? ` · incendio ${a.fechaIncendio}` : ''}
          </Text>
          {a.especiesRecomendadas.length ? (
            <Text style={styles.detalle}>Especies: {a.especiesRecomendadas.map(id => nombreEspecie[id] ?? id).join(', ')}</Text>
          ) : null}
          {resumen[a.id] ? (
            <Text style={styles.avance}>
              {resumen[a.id].pildoras} píldoras · {resumen[a.id].vivas} plántulas vivas
              {resumen[a.id].alturaPromedioCm !== null ? ` · ${resumen[a.id].alturaPromedioCm} cm promedio` : ''}
            </Text>
          ) : null}
          {a.notas ? <Text style={styles.nota}>{a.notas}</Text> : null}
          {gestiona ? (
            <View style={styles.acciones}>
              <BotonChico texto="✏️ Editar" onPress={() => setEditando(a.id)} />
              {esAdmin ? <BotonChico texto="🗑️ Eliminar" color={colores.rojo} onPress={() => eliminar(a)} /> : null}
            </View>
          ) : null}
        </Tarjeta>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  leyenda: { fontSize: 12, color: colores.textoSuave, marginBottom: 4 },
  nombre: { fontSize: 15, fontWeight: '700', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  avance: { fontSize: 13, color: colores.verde, marginTop: 4, fontWeight: '600' },
  nota: { fontSize: 12, color: colores.ambar, marginTop: 4, fontStyle: 'italic' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap' },
  fila: { flexDirection: 'row', gap: 8 },
  formTitulo: { fontSize: 16, fontWeight: '700', color: colores.verde, marginBottom: 10 },
});
