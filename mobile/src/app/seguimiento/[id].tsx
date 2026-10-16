import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Seguimiento } from '@/lib/types';
import { Aviso, Boton, Campo, colores, fecha, Opciones, Pantalla, Seccion, Tarjeta } from '@/components/ui';
import { alerta } from '@/lib/alerta';

const HUMEDAD = ['seco', 'húmedo', 'encharcado'] as const;

export default function SeguimientoDispersion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useUsuario();
  const { data, error, recargar } = useData(async () => {
    const [dispersion, seguimientos] = await Promise.all([api.dispersion(id), api.seguimientos(id)]);
    return { dispersion, seguimientos };
  });

  const [germinadas, setGerminadas] = useState('');
  const [vivas, setVivas] = useState('');
  const [altura, setAltura] = useState('');
  const [humedad, setHumedad] = useState<Seguimiento['humedadSuelo'] | null>(null);
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const d = data?.dispersion;
  const dias = d ? Math.floor((Date.now() - new Date(d.creadoEn).getTime()) / 86400000) : 0;

  const enviar = async () => {
    setEnviando(true);
    try {
      await api.crearSeguimiento({
        dispersionId: id,
        germinadas: Number(germinadas),
        vivas: vivas === '' ? undefined : Number(vivas),
        alturaPromedioCm: altura === '' ? undefined : Number(altura),
        humedadSuelo: humedad ?? undefined,
        notas,
        usuarioId: usuario?.id,
      });
      setGerminadas('');
      setVivas('');
      setAltura('');
      setNotas('');
      alerta('Guardado', 'Seguimiento registrado.');
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla titulo={d?.zona ?? 'Seguimiento'} subtitulo={d ? `${d.cantidad} píldoras · lanzadas hace ${dias} días` : undefined}>
      {error ? <Aviso texto={error} /> : null}
      <Aviso tipo="info" texto="Cuenta las plántulas en el área donde lanzaste las píldoras. Revisa a las 2, 4 y 8 semanas." />

      <Campo etiqueta="Plántulas germinadas (total)" value={germinadas} onChangeText={setGerminadas} keyboardType="number-pad" placeholder="Ej: 12" />
      <Campo etiqueta="Plántulas vivas hoy" value={vivas} onChangeText={setVivas} keyboardType="number-pad" placeholder="Ej: 9" />
      <Campo etiqueta="Altura promedio (cm)" value={altura} onChangeText={setAltura} keyboardType="decimal-pad" placeholder="Mide 5 plántulas con regla y promedia" />
      <Opciones etiqueta="Humedad del suelo (al tacto)" opciones={HUMEDAD} valor={humedad ?? null} onChange={setHumedad} />
      <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline placeholder="Ej: algunas píldoras siguen enteras, hay hormigas" />
      <Boton texto="Guardar seguimiento" onPress={enviar} cargando={enviando} />

      {data?.seguimientos.length ? <Seccion>Historial</Seccion> : null}
      {[...(data?.seguimientos ?? [])].reverse().map(s => (
        <Tarjeta key={s.id}>
          <Text style={styles.nombre}>
            {s.germinadas} germinadas · {s.vivas ?? '–'} vivas{s.alturaPromedioCm !== undefined ? ` · ${s.alturaPromedioCm} cm` : ''}
          </Text>
          <Text style={styles.detalle}>
            {fecha(s.creadoEn)}{s.humedadSuelo ? ` · suelo ${s.humedadSuelo}` : ''}{s.notas ? ` · ${s.notas}` : ''}
          </Text>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  nombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
});
