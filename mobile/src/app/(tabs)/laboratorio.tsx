import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { useData } from '@/lib/useData';
import { nombresDe, useCatalogos } from '@/lib/catalogos';
import { useUsuario } from '@/lib/usuario';
import { Aviso, Boton, Campo, colores, fecha, Opciones, Pantalla, Seccion, Tarjeta, OpcionesMultiples } from '@/components/ui';
import { alerta } from '@/lib/alerta';

import Lotes from '@/components/laboratorio/Lotes';
import Referencia from '@/components/laboratorio/Referencia';

type Vista = 'lotes' | 'ensayos' | 'referencia';

// Pruebas que se calculan a partir de pesadas o conteos
function calcular(prueba: string, v: Record<string, string>): number | null {
  const n = (k: string) => Number(v[k]);
  const ok = (...ks: string[]) => ks.every(k => v[k] !== undefined && v[k] !== '' && !Number.isNaN(n(k)));
  if (prueba === 'retencionAgua' && ok('seco', 'humedo') && n('seco') > 0) {
    return ((n('humedo') - n('seco')) / n('seco')) * 100;
  }
  if (prueba === 'perdidaAgua24h' && ok('seco', 'humedo', 'humedo24') && n('humedo') > n('seco')) {
    return ((n('humedo') - n('humedo24')) / (n('humedo') - n('seco'))) * 100;
  }
  if (prueba === 'germinacion' && ok('sembradas', 'germinadas') && n('sembradas') > 0) {
    return (n('germinadas') / n('sembradas')) * 100;
  }
  return null;
}

// Pruebas con calculadora integrada (las demás se capturan como valor directo)
const CALCULADAS = ['retencionAgua', 'perdidaAgua24h', 'germinacion'];

function Ensayos() {
  const { usuario } = useUsuario();
  const { data, error, recargar } = useData(async () => {
    const [catalogos, stats] = await Promise.all([api.catalogos(), api.stats()]);
    return { catalogos, stats };
  });
  const [tratamiento, setTratamiento] = useState<string | null>(null);
  const [prueba, setPrueba] = useState<string | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [valorDirecto, setValorDirecto] = useState('');
  const [repeticion, setRepeticion] = useState('1');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const tratamientos = data?.catalogos.tratamientos ?? [];
  const pruebas = data?.catalogos.pruebas ?? [];
  const nombreTratamiento = nombresDe(tratamientos);
  const nombrePrueba = nombresDe(pruebas);
  const pruebaSel = pruebas.find(p => p.id === prueba);
  const unidad = pruebaSel?.unidad ?? '';
  const esCalculada = !!prueba && CALCULADAS.includes(prueba);
  const calculado = prueba && esCalculada ? calcular(prueba, valores) : null;
  const set = (k: string) => (t: string) => setValores(v => ({ ...v, [k]: t }));

  const enviar = async () => {
    if (!tratamiento || !prueba) return alerta('Falta dato', 'Elige tratamiento y prueba');
    const valor = esCalculada ? calculado : Number(valorDirecto);
    if (valor === null || Number.isNaN(valor)) return alerta('Falta dato', 'Captura las mediciones');
    setEnviando(true);
    try {
      const datosCrudos = esCalculada ? ` [${Object.entries(valores).map(([k, v]) => `${k}=${v}`).join(', ')}]` : '';
      await api.crearEnsayo({
        tratamiento,
        prueba,
        valor: Math.round(valor * 10) / 10,
        repeticion: Number(repeticion) || undefined,
        notas: `${notas}${datosCrudos}`.trim(),
        usuarioId: usuario?.id,
      });
      setValores({});
      setValorDirecto('');
      setNotas('');
      setRepeticion(String((Number(repeticion) || 0) + 1));
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const resumen = data?.stats.ensayos ?? [];
  const pruebasConDatos = [...new Set(resumen.map(r => r.prueba))];

  return (
    <>
      {error ? <Aviso texto={error} /> : null}
      <Aviso tipo="info" texto="Se mide con báscula de cocina (0.1 g), regla, vaso y cronómetro. No se necesitan sensores." />

      <Seccion>Registrar medición</Seccion>
      <Opciones etiqueta="Tratamiento (mezcla)" opciones={tratamientos.map(t => t.id)} nombres={nombreTratamiento} valor={tratamiento} onChange={setTratamiento} />
      {tratamiento && tratamientos.find(t => t.id === tratamiento)?.descripcion ? (
        <Text style={styles.ayudaTratamiento}>{tratamientos.find(t => t.id === tratamiento)?.descripcion}</Text>
      ) : null}
      <Opciones etiqueta="Prueba" opciones={pruebas.map(p => p.id)} nombres={nombrePrueba} valor={prueba} onChange={p => { setPrueba(p); setValores({}); }} />
      {pruebaSel?.instrucciones ? <Aviso tipo="ok" texto={pruebaSel.instrucciones} /> : null}

      {prueba === 'retencionAgua' || prueba === 'perdidaAgua24h' ? (
        <>
          <Campo etiqueta="Peso seco (g)" value={valores.seco ?? ''} onChangeText={set('seco')} keyboardType="decimal-pad" />
          <Campo etiqueta="Peso mojado (g)" value={valores.humedo ?? ''} onChangeText={set('humedo')} keyboardType="decimal-pad" />
        </>
      ) : null}
      {prueba === 'perdidaAgua24h' ? (
        <Campo etiqueta="Peso a las 24 h (g)" value={valores.humedo24 ?? ''} onChangeText={set('humedo24')} keyboardType="decimal-pad" />
      ) : null}
      {prueba === 'germinacion' ? (
        <>
          <Campo etiqueta="Semillas sembradas" value={valores.sembradas ?? ''} onChangeText={set('sembradas')} keyboardType="number-pad" />
          <Campo etiqueta="Semillas germinadas" value={valores.germinadas ?? ''} onChangeText={set('germinadas')} keyboardType="number-pad" />
        </>
      ) : null}
      {prueba && esCalculada ? (
        <Text style={styles.resultado}>Resultado: {calculado === null ? '–' : `${calculado.toFixed(1)} ${unidad}`}</Text>
      ) : null}
      {prueba && !esCalculada ? (
        <Campo etiqueta={`Valor (${unidad})`} value={valorDirecto} onChangeText={setValorDirecto} keyboardType="decimal-pad" />
      ) : null}

      <Campo etiqueta="Repetición #" value={repeticion} onChangeText={setRepeticion} keyboardType="number-pad" ayuda="Haz al menos 3 repeticiones por tratamiento" />
      <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline />
      <Boton texto="Guardar medición" color={colores.azul} onPress={enviar} cargando={enviando} />

      {pruebasConDatos.length ? <Seccion>Comparación de mezclas (promedios)</Seccion> : null}
      {pruebasConDatos.map(p => (
        <Tarjeta key={p}>
          <Text style={styles.nombre}>{nombrePrueba[p] ?? p}</Text>
          {resumen.filter(r => r.prueba === p).map(r => (
            <View key={r.tratamiento} style={styles.filaTabla}>
              <Text style={styles.detalle}>{nombreTratamiento[r.tratamiento] ?? r.tratamiento}</Text>
              <Text style={styles.valorTabla}>{r.promedio} {r.unidad} <Text style={styles.detalle}>(n={r.n})</Text></Text>
            </View>
          ))}
        </Tarjeta>
      ))}
    </>
  );
}

export default function Laboratorio() {
  const [vista, setVista] = useState<Vista>('lotes');
  return (
    <Pantalla titulo="Laboratorio 🧪" subtitulo="Producción de lotes y pruebas de las mezclas">
      <Opciones
        etiqueta=""
        opciones={['lotes', 'ensayos', 'referencia'] as const}
        nombres={{ lotes: '🧪 Lotes', ensayos: '📏 Ensayos', referencia: '📖 Composición del Ficus' }}
        valor={vista}
        onChange={setVista}
      />
      {vista === 'lotes' ? <Lotes /> : null}
      {vista === 'ensayos' ? <Ensayos /> : null}
      {vista === 'referencia' ? <Referencia /> : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto, marginBottom: 6 },
  mezcla: { flexDirection: 'row', gap: 8 },
  suma: { fontSize: 13, fontWeight: '700', marginTop: -6, marginBottom: 12 },
  nombre: { fontSize: 15, fontWeight: '600', color: colores.texto, marginBottom: 4 },
  detalle: { fontSize: 12, color: colores.textoSuave },
  ayudaTratamiento: { fontSize: 12, color: colores.textoSuave, marginTop: -8, marginBottom: 12 },
  resultado: { fontSize: 16, fontWeight: '700', color: colores.azul, marginBottom: 14 },
  filaTabla: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  valorTabla: { fontSize: 14, fontWeight: '700', color: colores.texto },
});
