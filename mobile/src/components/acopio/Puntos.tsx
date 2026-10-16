import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { api } from '@/lib/api';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import Mapa from '@/components/Mapa';
import { Aviso, Boton, Campo, colores, fecha, Opciones, Seccion, Tarjeta } from '@/components/ui';
import { alerta } from '@/lib/alerta';

// Puntos de acopio y entregas de poda fresca
export default function Puntos() {
  const { usuario } = useUsuario();
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
    if (!puntoId) return alerta('Falta dato', 'Elige un punto de acopio');
    setEnviando(true);
    try {
      await api.crearEntregaPoda({ puntoId, kg: Number(kg), notas, usuarioId: usuario?.id });
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

  return (
    <>
      {error ? <Aviso texto={error} /> : null}
      <Mapa puntos={marcadores} />
      <Text style={styles.leyenda}>🟠 Punto de acopio   🟢 Dispersión de píldoras</Text>

      <Seccion>Puntos de acopio</Seccion>
      {puntos.map(p => (
        <Tarjeta key={p.id}>
          <Text style={styles.nombre}>{p.nombre}</Text>
          <Text style={styles.detalle}>{p.direccion}</Text>
          <Text style={styles.kg}>{kgPorPunto(p.id).toFixed(1)} kg recibidos</Text>
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
});
