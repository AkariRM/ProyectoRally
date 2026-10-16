import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Fraccion, TipoProceso } from '@/lib/types';
import { Aviso, Boton, Campo, colores, fecha, Opciones, Seccion, Tarjeta } from '@/components/ui';
import { alerta } from '@/lib/alerta';

const TIPOS: TipoProceso[] = ['secado', 'triturado'];
const FRACCIONES: Fraccion[] = ['fina', 'media', 'mixta'];

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
        <Etapa emoji="🟤" titulo="Triturada" kg={inv?.triturada ?? 0} color={colores.tierraClaro} />
        <Etapa emoji="🧪" titulo="En lotes" kg={inv?.usada ?? 0} color={colores.azulClaro} ultimo />
      </View>

      <Tarjeta>
        <Text style={styles.linea}>Recibida en total: <Text style={styles.bold}>{inv?.recibida ?? 0} kg</Text></Text>
        <Text style={styles.linea}>
          Pérdida de agua al secar: <Text style={styles.bold}>{inv?.perdidaSecado ?? '–'}{inv?.perdidaSecado !== null && inv ? ' %' : ''}</Text>
        </Text>
        <Text style={styles.linea}>
          Rendimiento del triturado: <Text style={styles.bold}>{inv?.rendimientoTriturado ?? '–'}{inv?.rendimientoTriturado !== null && inv ? ' %' : ''}</Text>
        </Text>
        {inv && Object.keys(inv.trituradaPorFraccion).length ? (
          <Text style={styles.linea}>
            Triturada por fracción: {Object.entries(inv.trituradaPorFraccion).map(([f, kg]) => `${f} ${kg} kg`).join(' · ')}
          </Text>
        ) : null}
      </Tarjeta>

      <Seccion>Registrar proceso</Seccion>
      <Opciones etiqueta="Proceso" opciones={TIPOS} valor={tipo} onChange={setTipo} nombres={{ secado: '☀️ Secado', triturado: '🟤 Triturado' }} />
      <Aviso
        tipo="info"
        texto={tipo === 'secado'
          ? `Pesa la poda fresca que pones a secar y pésala otra vez ya seca. Disponible: ${disponible ?? 0} kg fresca.`
          : `Pesa la poda seca antes de triturar y la fibra que sale. Disponible: ${disponible ?? 0} kg seca.`}
      />
      <Campo etiqueta={tipo === 'secado' ? 'Kg fresca (entrada)' : 'Kg seca (entrada)'} value={kgEntrada} onChangeText={setKgEntrada} keyboardType="decimal-pad" />
      <Campo etiqueta={tipo === 'secado' ? 'Kg seca (salida)' : 'Kg triturada (salida)'} value={kgSalida} onChangeText={setKgSalida} keyboardType="decimal-pad" />
      {rendimiento !== null ? (
        <Text style={styles.calculo}>
          {tipo === 'secado' ? `Humedad perdida: ${(100 - rendimiento).toFixed(1)} %` : `Rendimiento: ${rendimiento.toFixed(1)} %`}
        </Text>
      ) : null}
      {tipo === 'triturado' ? <Opciones etiqueta="Fracción" opciones={FRACCIONES} valor={fraccion} onChange={setFraccion} nombres={{ fina: 'Fina (< 2 mm)', media: 'Media (2–5 mm)', mixta: 'Mixta' }} /> : null}
      <Campo etiqueta="Método" value={metodo} onChangeText={setMetodo} placeholder={tipo === 'secado' ? 'Ej: sombra, malla, volteo cada 2 días' : 'Ej: licuadora, molino de martillos'} />
      {tipo === 'secado' ? <Campo etiqueta="Días de secado" value={dias} onChangeText={setDias} keyboardType="number-pad" /> : null}
      <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline />
      <Boton texto="Registrar proceso" color={colores.tierra} onPress={enviar} cargando={enviando} />

      {data?.procesos.length ? <Seccion>Historial</Seccion> : null}
      {[...(data?.procesos ?? [])].reverse().slice(0, 15).map(p => (
        <Tarjeta key={p.id}>
          <Text style={styles.nombre}>
            {p.tipo === 'secado' ? '☀️ Secado' : '🟤 Triturado'} · {p.kgEntrada} → {p.kgSalida} kg
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
