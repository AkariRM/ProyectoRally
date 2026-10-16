import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Fraccion, TipoProceso } from '@/lib/types';
import { Aviso, Boton, Campo, colores, fecha, Opciones, Seccion, Tarjeta } from '@/components/ui';
import { alerta } from '@/lib/alerta';

const TIPOS: TipoProceso[] = ['secado', 'triturado', 'pirolisis', 'molienda'];
const FRACCIONES: Fraccion[] = ['fina', 'media', 'mixta'];

// Qué entra, qué sale y cómo se hace cada proceso (documento de la problemática)
const PROCESO: Record<TipoProceso, { nombre: string; entra: string; sale: string; ayuda: string; metodo: string }> = {
  secado: {
    nombre: '☀️ Secado', entra: 'fresca', sale: 'seca',
    ayuda: 'Pesa la poda fresca que pones a secar al sol y pésala otra vez ya seca.',
    metodo: 'Ej: al sol sobre malla, volteo diario',
  },
  triturado: {
    nombre: '🍃 Triturado (escamas)', entra: 'seca', sale: 'escamas',
    ayuda: 'Hojas secas y ramillas tiernas trituradas hasta escamas finas de 2 a 3 mm.',
    metodo: 'Ej: licuadora, molino de martillos, tamiz de 3 mm',
  },
  pirolisis: {
    nombre: '🔥 Pirólisis (biochar)', entra: 'seca', sale: 'biochar',
    ayuda: 'Ramas secas calentadas a más de 450 °C sin oxígeno (horno de retorta o tambor cerrado). Pesa las ramas y el carbón que sale.',
    metodo: 'Ej: tambor metálico cerrado, retorta',
  },
  molienda: {
    nombre: '🌾 Molienda (harina)', entra: 'seca', sale: 'harina',
    ayuda: 'Pasto y hojas secas molidos hasta harina fina.',
    metodo: 'Ej: molino de granos, licuadora y tamiz fino',
  },
};

function Etapa({ emoji, titulo, kg, color, ultimo }: { emoji: string; titulo: string; kg: number; color: string; ultimo?: boolean }) {
  return (
    <View style={styles.etapaFila}>
      <View style={[styles.etapa, { backgroundColor: color }]}>
        <Text style={styles.etapaEmoji}>{emoji}</Text>
        <Text style={styles.etapaKg}>{kg} kg</Text>
        <Text style={styles.etapaTitulo}>{titulo}</Text>
      </View>
      {!ultimo ? <Text style={styles.flecha}>›</Text> : null}
    </View>
  );
}

// Inventario y procesamiento de la biomasa: fresca → seca → triturada → usada en lotes
export default function Biomasa() {
  const { usuario } = useUsuario();
  const { data, error, recargar } = useData(async () => {
    const [inventario, procesos] = await Promise.all([api.inventarioBiomasa(), api.procesosBiomasa()]);
    return { inventario, procesos };
  });

  const [tipo, setTipo] = useState<TipoProceso | null>('secado');
  const [kgEntrada, setKgEntrada] = useState('');
  const [kgSalida, setKgSalida] = useState('');
  const [fraccion, setFraccion] = useState<Fraccion | null>(null);
  const [metodo, setMetodo] = useState('');
  const [dias, setDias] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const inv = data?.inventario;
  const disponible = tipo === 'secado' ? inv?.fresca : inv?.seca;
  const proc = PROCESO[tipo ?? 'secado'];
  const [temperatura, setTemperatura] = useState('');
  const entrada = Number(kgEntrada);
  const salida = Number(kgSalida);
  const rendimiento = entrada > 0 && kgSalida !== '' ? (salida / entrada) * 100 : null;

  const enviar = async () => {
    if (!tipo) return;
    setEnviando(true);
    try {
      await api.crearProcesoBiomasa({
        tipo, kgEntrada: entrada, kgSalida: salida,
        fraccion: tipo === 'triturado' ? fraccion ?? undefined : undefined,
        temperaturaC: tipo === 'pirolisis' && temperatura ? Number(temperatura) : undefined,
        metodo, dias: dias ? Number(dias) : undefined, notas, usuarioId: usuario?.id,
      });
      setKgEntrada('');
      setKgSalida('');
      setNotas('');
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

      <Seccion>Inventario actual</Seccion>
      <View style={styles.flujo}>
        <Etapa emoji="🌿" titulo="Fresca" kg={inv?.fresca ?? 0} color={colores.verdeClaro} />
        <Etapa emoji="☀️" titulo="Seca" kg={inv?.seca ?? 0} color={colores.ambarClaro} />
        <Etapa emoji="🧪" titulo="En lotes" kg={inv?.usada ?? 0} color={colores.azulClaro} ultimo />
      </View>
      <View style={styles.flujo}>
        <Etapa emoji="🍃" titulo="Escamas 2–3 mm" kg={inv?.triturada ?? 0} color={colores.tierraClaro} />
        <Etapa emoji="🔥" titulo="Biochar" kg={inv?.biochar ?? 0} color={colores.tierraClaro} />
        <Etapa emoji="🌾" titulo="Harina" kg={inv?.harina ?? 0} color={colores.tierraClaro} ultimo />
      </View>

      <Tarjeta>
        <Text style={styles.linea}>Recibida en total: <Text style={styles.bold}>{inv?.recibida ?? 0} kg</Text></Text>
        <Text style={styles.linea}>
          Pérdida de agua al secar: <Text style={styles.bold}>{inv?.perdidaSecado ?? '–'}{inv?.perdidaSecado !== null && inv ? ' %' : ''}</Text>
        </Text>
        <Text style={styles.linea}>
          Rendimiento del triturado: <Text style={styles.bold}>{inv?.rendimientoTriturado ?? '–'}{inv?.rendimientoTriturado !== null && inv ? ' %' : ''}</Text>
          {'  ·  '}Pirólisis: <Text style={styles.bold}>{inv?.rendimientoPirolisis ?? '–'}{inv?.rendimientoPirolisis != null ? ' %' : ''}</Text>
          {'  ·  '}Molienda: <Text style={styles.bold}>{inv?.rendimientoMolienda ?? '–'}{inv?.rendimientoMolienda != null ? ' %' : ''}</Text>
        </Text>
        {inv && Object.keys(inv.trituradaPorFraccion).length ? (
          <Text style={styles.linea}>
            Triturada por fracción: {Object.entries(inv.trituradaPorFraccion).map(([f, kg]) => `${f} ${kg} kg`).join(' · ')}
          </Text>
        ) : null}
      </Tarjeta>

      <Seccion>Registrar proceso</Seccion>
      <Opciones etiqueta="Proceso" opciones={TIPOS} valor={tipo} onChange={setTipo} nombres={Object.fromEntries(TIPOS.map(t => [t, PROCESO[t].nombre]))} />
      <Aviso
        tipo="info"
        texto={`${proc.ayuda} Disponible: ${disponible ?? 0} kg de poda ${proc.entra}.`}
      />
      <Campo etiqueta={`Kg ${proc.entra} (entrada)`} value={kgEntrada} onChangeText={setKgEntrada} keyboardType="decimal-pad" />
      <Campo etiqueta={`Kg ${proc.sale} (salida)`} value={kgSalida} onChangeText={setKgSalida} keyboardType="decimal-pad" />
      {tipo === 'pirolisis' ? (
        <Campo etiqueta="Temperatura alcanzada (°C)" value={temperatura} onChangeText={setTemperatura} keyboardType="number-pad" ayuda="Debe superar 450 °C" />
      ) : null}
      {rendimiento !== null ? (
        <Text style={styles.calculo}>
          {tipo === 'secado' ? `Humedad perdida: ${(100 - rendimiento).toFixed(1)} %` : `Rendimiento: ${rendimiento.toFixed(1)} %`}
        </Text>
      ) : null}
      {tipo === 'triturado' ? <Opciones etiqueta="Fracción" opciones={FRACCIONES} valor={fraccion} onChange={setFraccion} nombres={{ fina: 'Escamas 2–3 mm (objetivo)', media: 'Gruesa > 3 mm (volver a moler)', mixta: 'Mixta' }} /> : null}
      <Campo etiqueta="Método" value={metodo} onChangeText={setMetodo} placeholder={proc.metodo} />
      {tipo === 'secado' ? <Campo etiqueta="Días de secado" value={dias} onChangeText={setDias} keyboardType="number-pad" /> : null}
      <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline />
      <Boton texto="Registrar proceso" color={colores.tierra} onPress={enviar} cargando={enviando} />

      {data?.procesos.length ? <Seccion>Historial</Seccion> : null}
      {[...(data?.procesos ?? [])].reverse().slice(0, 15).map(p => (
        <Tarjeta key={p.id}>
          <Text style={styles.nombre}>
            {PROCESO[p.tipo]?.nombre ?? p.tipo} · {p.kgEntrada} → {p.kgSalida} kg{p.temperaturaC ? ` · ${p.temperaturaC} °C` : ''}
          </Text>
          <Text style={styles.detalle}>
            {fecha(p.creadoEn)}{p.fraccion ? ` · ${p.fraccion}` : ''}{p.metodo ? ` · ${p.metodo}` : ''}{p.dias ? ` · ${p.dias} días` : ''}
          </Text>
        </Tarjeta>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  flujo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  etapaFila: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  etapa: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  etapaEmoji: { fontSize: 18 },
  etapaKg: { fontSize: 14, fontWeight: '700', color: colores.texto, marginTop: 2 },
  etapaTitulo: { fontSize: 10, color: '#555' },
  flecha: { fontSize: 18, color: '#bbb', marginHorizontal: 2 },
  linea: { fontSize: 13, color: colores.texto, marginBottom: 4 },
  bold: { fontWeight: '700' },
  calculo: { fontSize: 14, fontWeight: '700', color: colores.tierra, marginTop: -6, marginBottom: 12 },
  nombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
});
