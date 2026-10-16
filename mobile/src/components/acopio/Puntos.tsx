import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { alerta, confirmar } from '@/lib/alerta';
import { obtenerUbicacion } from '@/lib/gps';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Municipio, PuntoAcopio, TipoMaterial } from '@/lib/types';
import { nombresDe, useCatalogos } from '@/lib/catalogos';
import Mapa from '@/components/Mapa';
import ModalPasos from '@/components/ModalPasos';
import { Aviso, Boton, BotonChico, Campo, colores, fecha, ListaDesplegable, Opciones, Seccion, Tarjeta } from '@/components/ui';

const MUNICIPIOS: Municipio[] = ['Jiquilpan', 'Sahuayo', 'Otro'];
const TIPOS = ['parque', 'plaza', 'escuela', 'vivero', 'domicilio', 'otro'] as const;
type Tipo = (typeof TIPOS)[number];

// Formulario para crear o editar un punto de acopio (solo admin), en 2 pasos
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
    <ModalPasos
      titulo={punto ? `Editar: ${punto.nombre}` : 'Nuevo punto de acopio'}
      onCerrar={onCancelar}
      onFinal={guardar}
      cargando={enviando}
      textoFinal={punto ? 'Guardar cambios' : 'Crear punto'}
      pasos={[
        {
          titulo: 'Datos',
          falta: nombre.trim() ? null : 'Escribe el nombre del punto',
          contenido: (
            <>
              <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} placeholder="Ej: Vivero del ITJ" />
              <Campo etiqueta="Dirección" value={direccion} onChangeText={setDireccion} placeholder="Calle, número, colonia" />
              <Opciones etiqueta="Municipio" opciones={MUNICIPIOS} valor={municipio} onChange={setMunicipio} />
              <Opciones etiqueta="Tipo" opciones={TIPOS} valor={tipo} onChange={setTipo} />
            </>
          ),
        },
        {
          titulo: 'Ubicación',
          contenido: (
            <>
              <Boton texto="📍 Usar mi ubicación actual" onPress={usarGps} secundario />
              <View style={styles.fila}>
                <View style={{ flex: 1 }}><Campo etiqueta="Latitud" value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" placeholder="19.99" /></View>
                <View style={{ flex: 1 }}><Campo etiqueta="Longitud" value={lng} onChangeText={setLng} keyboardType="numbers-and-punctuation" placeholder="-102.71" /></View>
              </View>
            </>
          ),
        },
      ]}
    />
  );
}

// Registrar una entrega de poda fresca en un punto, en 3 pasos
function FormEntrega({ puntos, puntoInicial, onListo, onCerrar }: {
  puntos: PuntoAcopio[]; puntoInicial?: string; onListo: () => void; onCerrar: () => void;
}) {
  const [puntoId, setPuntoId] = useState<string | null>(puntoInicial ?? null);
  const [kg, setKg] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState<TipoMaterial | null>(null);
  const { data: catalogos } = useCatalogos();
  const [especieArbol, setEspecieArbol] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setEnviando(true);
    try {
      await api.crearEntregaPoda({
        puntoId: puntoId!, kg: Number(kg), notas, tipoMaterial: tipoMaterial ?? undefined, especieArbol: especieArbol || undefined,
      });
      alerta('¡Gracias!', 'Entrega de poda registrada.');
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalPasos
      titulo="Entrega de poda fresca"
      color={colores.tierra}
      onCerrar={onCerrar}
      onFinal={enviar}
      cargando={enviando}
      textoFinal="Registrar entrega"
      pasos={[
        {
          titulo: 'Punto de acopio',
          falta: puntoId ? null : 'Elige un punto de acopio',
          contenido: (
            <Opciones
              etiqueta="¿Dónde la entregas?"
              opciones={puntos.map(p => p.id)}
              nombres={Object.fromEntries(puntos.map(p => [p.id, p.nombre]))}
              valor={puntoId}
              onChange={setPuntoId}
            />
          ),
        },
        {
          titulo: 'Material',
          contenido: (
            <>
              <Opciones
                etiqueta="Tipo de material"
                opciones={(catalogos?.tiposMaterial ?? []).map(t => t.id)}
                nombres={nombresDe(catalogos?.tiposMaterial)}
                valor={tipoMaterial}
                onChange={setTipoMaterial}
              />
              <Campo etiqueta="Árbol (opcional)" value={especieArbol} onChangeText={setEspecieArbol} placeholder="Ej: Ficus benjamina, fresno, jacaranda" />
            </>
          ),
        },
        {
          titulo: 'Peso',
          falta: Number(kg) > 0 ? null : 'Escribe cuántos kg entregas',
          contenido: (
            <>
              <Campo etiqueta="Kilogramos (fresca)" value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="Ej: 5.5" ayuda="Pesa la bolsa o costal antes de entregarlo" />
              <Campo etiqueta="Notas (opcional)" value={notas} onChangeText={setNotas} multiline placeholder="Ej: hojas y ramas delgadas, poda de la plaza" />
            </>
          ),
        },
      ]}
    />
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

  const [editando, setEditando] = useState<string | 'nuevo' | null>(null);
  // null: cerrado · '': sin punto elegido · id: con ese punto ya elegido
  const [entregando, setEntregando] = useState<string | null>(null);

  const puntos = data?.puntos ?? [];
  const entregas = data?.entregas ?? [];
  const kgPorPunto = (id: string) =>
    entregas.filter(e => e.puntoId === id).reduce((t, e) => t + e.kg, 0);
  const nombrePunto = Object.fromEntries(puntos.map(p => [p.id, p.nombre]));
  const puntoEditado = puntos.find(p => p.id === editando);

  const marcadores = [
    ...puntos
      .filter(p => p.lat !== undefined && p.lng !== undefined)
      .map(p => ({ id: p.id, lat: p.lat!, lng: p.lng!, titulo: p.nombre, descripcion: `${kgPorPunto(p.id)} kg de poda`, color: 'orange' })),
    ...(data?.dispersiones ?? []).map(d => ({ id: d.id, lat: d.lat, lng: d.lng, titulo: d.zona, descripcion: `${d.cantidad} píldoras`, color: 'green' })),
  ];

  const entregar = (puntoId = '') => {
    if (!usuario) return alerta('Inicia sesión', 'Entra con tu correo en Inicio para registrar entregas.');
    setEntregando(puntoId);
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

  const terminar = () => {
    setEditando(null);
    setEntregando(null);
    recargar();
  };

  return (
    <>
      {error ? <Aviso texto={error} /> : null}
      <Mapa puntos={marcadores} />
      <Text style={styles.leyenda}>🟠 Punto de acopio   🟢 Dispersión de píldoras</Text>

      <Boton texto="➕ Registrar entrega de poda fresca" color={colores.tierra} onPress={() => entregar()} />

      <ListaDesplegable
        titulo="Puntos de acopio"
        vacio="Todavía no hay puntos de acopio."
        extra={esAdmin ? <BotonChico texto="+ Agregar punto de acopio" relleno onPress={() => setEditando('nuevo')} /> : null}
      >
        {puntos.map(p => (
          <Tarjeta key={p.id} style={{ marginTop: 8 }}>
            <Text style={styles.nombre}>{p.nombre}</Text>
            <Text style={styles.detalle}>{p.direccion}{p.municipio ? ` · ${p.municipio}` : ''}{p.tipo ? ` · ${p.tipo}` : ''}</Text>
            <Text style={styles.kg}>{kgPorPunto(p.id).toFixed(1)} kg recibidos</Text>
            <View style={styles.acciones}>
              <BotonChico texto="Entregar aquí" color={colores.tierra} onPress={() => entregar(p.id)} />
              {esAdmin ? (
                <>
                  <BotonChico texto="✏️ Editar" onPress={() => setEditando(p.id)} />
                  <BotonChico texto="🗑️ Eliminar" color={colores.rojo} onPress={() => eliminar(p)} />
                </>
              ) : null}
            </View>
          </Tarjeta>
        ))}
      </ListaDesplegable>

      {entregas.length ? <Seccion>Últimas entregas</Seccion> : null}
      {[...entregas].reverse().slice(0, 10).map(e => (
        <Tarjeta key={e.id}>
          <Text style={styles.nombre}>{e.kg} kg · {nombrePunto[e.puntoId] ?? e.puntoId}{e.tipoMaterial ? ` · ${e.tipoMaterial}` : ''}</Text>
          <Text style={styles.detalle}>{fecha(e.creadoEn)}{e.notas ? ` · ${e.notas}` : ''}</Text>
        </Tarjeta>
      ))}

      {editando === 'nuevo' ? <FormPunto onListo={terminar} onCancelar={() => setEditando(null)} /> : null}
      {puntoEditado ? <FormPunto punto={puntoEditado} onListo={terminar} onCancelar={() => setEditando(null)} /> : null}
      {entregando !== null ? (
        <FormEntrega puntos={puntos} puntoInicial={entregando || undefined} onListo={terminar} onCerrar={() => setEntregando(null)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  leyenda: { fontSize: 12, color: colores.textoSuave, marginBottom: 4 },
  nombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  kg: { fontSize: 13, color: colores.tierra, marginTop: 4, fontWeight: '600' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap' },
  fila: { flexDirection: 'row', gap: 8 },
});
