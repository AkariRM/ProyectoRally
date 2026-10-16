import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { useData } from '@/lib/useData';
import { nombresDe, useCatalogos } from '@/lib/catalogos';
import { useUsuario } from '@/lib/usuario';
import { Aviso, Boton, Campo, colores, fecha, Opciones, Pantalla, Seccion, Tarjeta, OpcionesMultiples } from '@/components/ui';
import { alerta } from '@/lib/alerta';

type Vista = 'lotes' | 'ensayos';

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

function Lotes() {
  const { usuario } = useUsuario();
  const { data, error, recargar } = useData(async () => {
    const [lotes, especies, inventario] = await Promise.all([api.lotes(), api.especies(), api.inventarioBiomasa()]);
    return { lotes, especies, inventario };
  });
  const [especieId, setEspecieId] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [arcilla, setArcilla] = useState('50');
  const [compost, setCompost] = useState('30');
  const [ficus, setFicus] = useState('20');
  const [diametro, setDiametro] = useState('');
  const [pesoPildora, setPesoPildora] = useState('20');
  const [aditivos, setAditivos] = useState<string[]>([]);
  const { data: catalogos } = useCatalogos();
  const [aditivosDetalle, setAditivosDetalle] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  // kg de ficus triturado que se necesitan para el lote
  const kgFicus = (Number(cantidad || 0) * Number(pesoPildora || 0) * Number(ficus || 0)) / 100 / 1000;
  const trituradaDisponible = data?.inventario.triturada ?? 0;

  const especies = data?.especies ?? [];
  const nombreEspecie = Object.fromEntries(especies.map(e => [e.id, e.nombreComun]));
  const suma = Number(arcilla || 0) + Number(compost || 0) + Number(ficus || 0);
  const especie = especies.find(e => e.id === especieId);

  const enviar = async () => {
    if (!especieId) return alerta('Falta dato', 'Elige la especie');
    setEnviando(true);
    try {
      const lote = await api.crearLote({
        especieId,
        cantidad: Number(cantidad),
        arcillaPct: Number(arcilla),
        compostPct: Number(compost),
        ficusPct: Number(ficus),
        diametroMm: diametro ? Number(diametro) : undefined,
        pesoPildoraG: Number(pesoPildora) || undefined,
        aditivos,
        aditivosDetalle: aditivosDetalle || undefined,
        notas,
        usuarioId: usuario?.id,
      });
      setCantidad('');
      setNotas('');
      alerta(
        'Lote creado',
        `Código ${lote.codigo}. Escríbelo en la charola de secado.${lote.advertencia ? `

⚠️ ${lote.advertencia}` : ''}`,
      );
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
      <Seccion>Nuevo lote de producción</Seccion>
      <Opciones etiqueta="Especie" opciones={especies.map(e => e.id)} nombres={nombreEspecie} valor={especieId} onChange={setEspecieId} />
      {especie ? (
        <Aviso
          tipo="info"
          texto={`${especie.nombreCientifico}\nTratamiento: ${especie.tratamientoPregerminativo ?? '–'}\nSiembra: ${especie.temporadaSiembra ?? '–'}${especie.validada ? '' : '\n⚠️ Pendiente de validar por Bioquímica'}`}
        />
      ) : null}
      <Campo etiqueta="Número de píldoras" value={cantidad} onChangeText={setCantidad} keyboardType="number-pad" placeholder="Ej: 100" />
      <Text style={styles.etiqueta}>Mezcla (% en peso seco)</Text>
      <View style={styles.mezcla}>
        <View style={{ flex: 1 }}><Campo etiqueta="Arcilla" value={arcilla} onChangeText={setArcilla} keyboardType="decimal-pad" /></View>
        <View style={{ flex: 1 }}><Campo etiqueta="Compost" value={compost} onChangeText={setCompost} keyboardType="decimal-pad" /></View>
        <View style={{ flex: 1 }}><Campo etiqueta="Ficus" value={ficus} onChangeText={setFicus} keyboardType="decimal-pad" /></View>
      </View>
      <Text style={[styles.suma, { color: Math.abs(suma - 100) > 0.5 ? colores.rojo : colores.verde }]}>Suma: {suma}%</Text>
      <Campo etiqueta="Peso por píldora (g)" value={pesoPildora} onChangeText={setPesoPildora} keyboardType="decimal-pad" />
      {kgFicus > 0 ? (
        <Aviso
          tipo={kgFicus > trituradaDisponible ? 'error' : 'ok'}
          texto={`Necesitas ${kgFicus.toFixed(2)} kg de ficus triturado · hay ${trituradaDisponible} kg en inventario`}
        />
      ) : null}
      <OpcionesMultiples
        etiqueta="Aditivos biológicos (opcional)"
        opciones={(catalogos?.aditivos ?? []).map(a => a.id)}
        nombres={nombresDe(catalogos?.aditivos)}
        valores={aditivos}
        onChange={setAditivos}
      />
      {aditivos.length ? (
        <Campo etiqueta="Detalle de aditivos" value={aditivosDetalle} onChangeText={setAditivosDetalle} placeholder="Ej: 5 g de inóculo de micorrizas por kg de mezcla" />
      ) : null}
      <Campo etiqueta="Diámetro (mm, opcional)" value={diametro} onChangeText={setDiametro} keyboardType="decimal-pad" placeholder="Ej: 25" />
      <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline placeholder="Ej: ficus triturado en licuadora, fibra corta" />
      <Boton texto="Crear lote" color={colores.azul} onPress={enviar} cargando={enviando} />

      {data?.lotes.length ? <Seccion>Lotes</Seccion> : null}
      {[...(data?.lotes ?? [])].reverse().map(l => (
        <Tarjeta key={l.id}>
          <Text style={styles.nombre}>{l.codigo} · {nombreEspecie[l.especieId] ?? l.especieId}</Text>
          <Text style={styles.detalle}>
            {l.cantidad} píldoras · arcilla {l.arcillaPct}% · compost {l.compostPct}% · ficus {l.ficusPct}%
            {l.kgFicus !== undefined ? ` · ${l.kgFicus} kg ficus` : ''}{l.aditivos?.length ? ` · + ${l.aditivos.map(a => nombresDe(catalogos?.aditivos)[a] ?? a).join(', ')}` : ''} · {fecha(l.creadoEn)}
          </Text>
        </Tarjeta>
      ))}
    </>
  );
}

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
      <Opciones etiqueta="" opciones={['lotes', 'ensayos'] as const} nombres={{ lotes: 'Lotes', ensayos: 'Ensayos' }} valor={vista} onChange={setVista} />
      {vista === 'lotes' ? <Lotes /> : <Ensayos />}
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
