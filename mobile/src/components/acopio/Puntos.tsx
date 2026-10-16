import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { alerta, confirmar } from '@/lib/alerta';
import { obtenerUbicacion } from '@/lib/gps';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Municipio, PuntoAcopio } from '@/lib/types';
import Mapa from '@/components/Mapa';
import { Aviso, Boton, BotonChico, Campo, colores, fecha, Opciones, Seccion, Tarjeta } from '@/components/ui';

const MUNICIPIOS: Municipio[] = ['Jiquilpan', 'Sahuayo', 'Otro'];
const TIPOS = ['parque', 'plaza', 'escuela', 'vivero', 'domicilio', 'otro'] as const;
type Tipo = (typeof TIPOS)[number];

// Formulario para crear o editar un punto de acopio (solo admin)
function FormPunto({ punto, onListo, onCancelar }: { punto?: PuntoAcopio; onListo: () => void; onCancelar: () => void }) {
  const [nombre, setNombre] = useState(punto?.nombre ?? '');
  const [direccion, setDireccion] = useState(punto?.direccion ?? '');
  const [municipio, setMunicipio] = useState<Municipio | null>(punto?.municipio ?? 'Jiquilpan');
  const [tipo, setTipo] = useState<Tipo | null>((punto?.tipo as Tipo) ?? 'plaza');
  const [lat, setLat] = useState(punto?.lat !== undefined ? String(punto.lat) : '');
  const [lng, setLng] = useState(punto?.lng !== undefined ? String(punto.lng) : '');
  const [enviando, setEnviando] = useState(false);

  const usarGps = async () => {
    const c = await obtenerUbicacion('ubicar el punto de acopio');
    if (c) {
      setLat(c.lat.toFixed(6));
      setLng(c.lng.toFixed(6));
    }
  };

  const guardar = async () => {
    setEnviando(true);
    const datos = {
      nombre, direccion, municipio: municipio ?? undefined, tipo: tipo ?? undefined,
      lat: lat ? Number(lat) : undefined, lng: lng ? Number(lng) : undefined,
    };
    try {
      if (punto) await api.editarPuntoAcopio(punto.id, datos);
      else await api.crearPuntoAcopio(datos);
      alerta('Guardado', punto ? 'Punto actualizado.' : 'Punto de acopio creado.');
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.formTitulo}>{punto ? `Editar: ${punto.nombre}` : 'Nuevo punto de acopio'}</Text>
      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} placeholder="Ej: Vivero del ITJ" />
      <Campo etiqueta="Dirección" value={direccion} onChangeText={setDireccion} placeholder="Calle, número, colonia" />
      <Opciones etiqueta="Municipio" opciones={MUNICIPIOS} valor={municipio} onChange={setMunicipio} />
      <Opciones etiqueta="Tipo" opciones={TIPOS} valor={tipo} onChange={setTipo} />
      <Boton texto="📍 Usar mi ubicación actual" onPress={usarGps} secundario />
      <View style={styles.fila}>
        <View style={{ flex: 1 }}><Campo etiqueta="Latitud" value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" placeholder="19.99" /></View>
        <View style={{ flex: 1 }}><Campo etiqueta="Longitud" value={lng} onChangeText={setLng} keyboardType="numbers-and-punctuation" placeholder="-102.71" /></View>
      </View>
      <Boton texto={punto ? 'Guardar cambios' : 'Crear punto'} onPress={guardar} cargando={enviando} />
      <Boton texto="Cancelar" onPress={onCancelar} secundario color={colores.textoSuave} />
    </View>
  );
}

// Puntos de acopio y entregas de poda fresca
export default function Puntos() {
  const { usuario, esAdmin } = useUsuario();
  const { data, error, recargar } = useData(async () => {
    const [puntos, entregas, dispersiones] = await Promise.all([
      api.puntosAcopio(), api.entregasPoda(), api.dispersiones(),
    ]);
    return { puntos, entregas, dispersiones };
  });

  const [puntoId, setPuntoId] = useState<string | null>(null);
  const [kg, setKg] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState<string | 'nuevo' | null>(null);

  const puntos = data?.puntos ?? [];
  const entregas = data?.entregas ?? [];
  const kgPorPunto = (id: string) =>
    entregas.filter(e => e.puntoId === id).reduce((t, e) => t + e.kg, 0);
  const nombrePunto = Object.fromEntries(puntos.map(p => [p.id, p.nombre]));

  const marcadores = [
    ...puntos
      .filter(p => p.lat !== undefined && p.lng !== undefined)
      .map(p => ({ id: p.id, lat: p.lat!, lng: p.lng!, titulo: p.nombre, descripcion: `${kgPorPunto(p.id)} kg de poda`, color: 'orange' })),
    ...(data?.dispersiones ?? []).map(d => ({ id: d.id, lat: d.lat, lng: d.lng, titulo: d.zona, descripcion: `${d.cantidad} píldoras`, color: 'green' })),
  ];

  const enviar = async () => {
    if (!usuario) return alerta('Inicia sesión', 'Entra con tu correo en Inicio para registrar entregas.');
    if (!puntoId) return alerta('Falta dato', 'Elige un punto de acopio');
    setEnviando(true);
    try {
      await api.crearEntregaPoda({ puntoId, kg: Number(kg), notas });
      setKg('');
      setNotas('');
      alerta('¡Gracias!', 'Entrega de poda registrada.');
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (p: PuntoAcopio) => {
    if (!(await confirmar('Eliminar punto de acopio', `¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`))) return;
    try {
      await api.eliminarPuntoAcopio(p.id);
      recargar();
    } catch (e) {
      alerta('No se pudo eliminar', (e as Error).message);
    }
  };

  const terminarEdicion = () => {
    setEditando(null);
    recargar();
  };

  return (
    <>
      {error ? <Aviso texto={error} /> : null}
      <Mapa puntos={marcadores} />
      <Text style={styles.leyenda}>🟠 Punto de acopio   🟢 Dispersión de píldoras</Text>

      <Seccion>Puntos de acopio</Seccion>
      {esAdmin && editando !== 'nuevo' ? (
        <BotonChico texto="+ Agregar punto de acopio" relleno onPress={() => setEditando('nuevo')} />
      ) : null}
      {editando === 'nuevo' ? <FormPunto onListo={terminarEdicion} onCancelar={() => setEditando(null)} /> : null}

      {puntos.map(p => (
        <Tarjeta key={p.id} style={{ marginTop: 8 }}>
          {editando === p.id ? (
            <FormPunto punto={p} onListo={terminarEdicion} onCancelar={() => setEditando(null)} />
          ) : (
            <>
              <Text style={styles.nombre}>{p.nombre}</Text>
              <Text style={styles.detalle}>{p.direccion}{p.municipio ? ` · ${p.municipio}` : ''}{p.tipo ? ` · ${p.tipo}` : ''}</Text>
              <Text style={styles.kg}>{kgPorPunto(p.id).toFixed(1)} kg recibidos</Text>
              {esAdmin ? (
                <View style={styles.acciones}>
                  <BotonChico texto="✏️ Editar" onPress={() => setEditando(p.id)} />
                  <BotonChico texto="🗑️ Eliminar" color={colores.rojo} onPress={() => eliminar(p)} />
                </View>
              ) : null}
            </>
          )}
        </Tarjeta>
      ))}

      <Seccion>Registrar entrega de poda fresca</Seccion>
      <Opciones
        etiqueta="Punto de acopio"
        opciones={puntos.map(p => p.id)}
        nombres={nombrePunto}
        valor={puntoId}
        onChange={setPuntoId}
      />
      <Campo etiqueta="Kilogramos (fresca)" value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="Ej: 5.5" ayuda="Pesa la bolsa o costal antes de entregarlo" />
      <Campo etiqueta="Notas (opcional)" value={notas} onChangeText={setNotas} multiline placeholder="Ej: hojas y ramas delgadas, poda de la plaza" />
      <Boton texto="Registrar entrega" color={colores.tierra} onPress={enviar} cargando={enviando} />

      {entregas.length ? <Seccion>Últimas entregas</Seccion> : null}
      {[...entregas].reverse().slice(0, 10).map(e => (
        <Tarjeta key={e.id}>
          <Text style={styles.nombre}>{e.kg} kg · {nombrePunto[e.puntoId] ?? e.puntoId}</Text>
          <Text style={styles.detalle}>{fecha(e.creadoEn)}{e.notas ? ` · ${e.notas}` : ''}</Text>
        </Tarjeta>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  leyenda: { fontSize: 12, color: colores.textoSuave, marginBottom: 4 },
  nombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  kg: { fontSize: 13, color: colores.tierra, marginTop: 4, fontWeight: '600' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap' },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 4, marginTop: 8 },
  formTitulo: { fontSize: 16, fontWeight: '700', color: colores.verde, marginBottom: 10 },
  fila: { flexDirection: 'row', gap: 8 },
});
