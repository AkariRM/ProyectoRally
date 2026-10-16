import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '@/lib/api';
import { alerta } from '@/lib/alerta';
import { balanceDeMasa, consumoDeBiomasa, NOMBRE_COMPONENTE, NOMBRE_RECURSO } from '@/lib/balance';
import { nombresDe } from '@/lib/catalogos';
import { useData } from '@/lib/useData';
import type { InventarioBiomasa, Lote } from '@/lib/types';
import {
  Aviso, Barra, Boton, BotonChico, Campo, colores, fecha, Opciones, OpcionesMultiples, Seccion, Tarjeta,
} from '@/components/ui';

type Fila = { ingredienteId: string; gramos: string };

const num = (t: string) => Number(t.replace(',', '.')) || 0;
const r1 = (n: number) => Math.round(n * 10) / 10;

// Producción de lotes: fórmula → ingredientes en gramos → esferas de 2–3 cm,
// con balance de masa y consumo de biomasa calculados al momento.
export default function Lotes() {
  const { data, error, recargar } = useData(async () => {
    const [lotes, especies, inventario, catalogos] = await Promise.all([
      api.lotes(), api.especies(), api.inventarioBiomasa(), api.catalogos(),
    ]);
    return { lotes, especies, inventario, catalogos };
  });

  const [especieId, setEspecieId] = useState<string | null>(null);
  const [formulaId, setFormulaId] = useState<string | null>(null);
  const [masaTotal, setMasaTotal] = useState('');
  const [filas, setFilas] = useState<Fila[]>([]);
  const [pesoPildora, setPesoPildora] = useState('10');
  const [diametro, setDiametro] = useState('25');
  const [aditivos, setAditivos] = useState<string[]>([]);
  const [aditivosDetalle, setAditivosDetalle] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const especies = data?.especies ?? [];
  const cat = data?.catalogos;
  const ingredientes = cat?.ingredientes ?? [];
  const formulas = cat?.formulas ?? [];
  const nombreIngrediente = nombresDe(ingredientes);
  const nombreEspecie = Object.fromEntries(especies.map(e => [e.id, e.nombreComun]));
  const especie = especies.find(e => e.id === especieId);
  const formula = formulas.find(f => f.id === formulaId);

  // Escala la fórmula a la masa indicada
  const aplicarFormula = (id: string, masa?: string) => {
    const f = formulas.find(x => x.id === id);
    if (!f) return;
    const total = masa !== undefined ? num(masa) : f.masaTotalG ?? 1000;
    setFormulaId(id);
    if (masa === undefined) setMasaTotal(String(total));
    setFilas(f.ingredientes.map(i => ({ ingredienteId: i.ingredienteId, gramos: String(r1((total * i.porcentaje) / 100)) })));
  };

  const cambiarMasa = (t: string) => {
    setMasaTotal(t);
    if (formulaId) aplicarFormula(formulaId, t);
  };

  const cambiarGramos = (idx: number, t: string) => {
    setFilas(fs => fs.map((f, i) => (i === idx ? { ...f, gramos: t } : f)));
    setFormulaId(null); // mezcla ajustada a mano
  };

  const agregarIngrediente = (id: string) => {
    if (filas.some(f => f.ingredienteId === id)) return;
    setFilas(fs => [...fs, { ingredienteId: id, gramos: '' }]);
    setFormulaId(null);
  };

  const quitar = (idx: number) => {
    setFilas(fs => fs.filter((_, i) => i !== idx));
    setFormulaId(null);
  };

  const lista = filas.map(f => ({ ingredienteId: f.ingredienteId, gramos: num(f.gramos) })).filter(f => f.gramos > 0);
  const balance = balanceDeMasa(lista, ingredientes, cat?.componentes ?? []);
  const consumo = consumoDeBiomasa(lista, ingredientes);
  const esferas = num(pesoPildora) > 0 ? Math.floor(balance.masaTotalG / num(pesoPildora)) : 0;
  const inventario = data?.inventario;
  const faltantes = Object.entries(consumo).filter(([r, kg]) => kg > ((inventario?.[r as keyof InventarioBiomasa] as number) ?? 0));
  const maxComp = Math.max(1, ...Object.values(balance.componentes).map(c => c.porcentaje));

  const enviar = async () => {
    if (!especieId) return alerta('Falta dato', 'Elige la especie');
    if (!lista.length) return alerta('Falta dato', 'Agrega ingredientes con sus gramos');
    setEnviando(true);
    try {
      const lote = await api.crearLote({
        especieId,
        formulaId: formulaId ?? undefined,
        ingredientes: lista,
        pesoPildoraG: num(pesoPildora) || undefined,
        diametroMm: num(diametro) || undefined,
        aditivos,
        aditivosDetalle: aditivosDetalle || undefined,
        notas,
      });
      setNotas('');
      alerta(
        'Lote creado',
        `Código ${lote.codigo}: ${lote.cantidad} esferas. Escríbelo en la charola de secado (a la sombra).${lote.advertencia ? `\n\n⚠️ ${lote.advertencia}` : ''}`,
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
      <Opciones etiqueta="Especie (semilla al centro)" opciones={especies.map(e => e.id)} nombres={nombreEspecie} valor={especieId} onChange={setEspecieId} />
      {especie ? (
        <Aviso
          tipo="info"
          texto={`${especie.nombreCientifico}\nTratamiento: ${especie.tratamientoPregerminativo ?? '–'}\nSiembra: ${especie.temporadaSiembra ?? '–'}${especie.validada ? '' : '\n⚠️ Pendiente de validar por Bioquímica'}`}
        />
      ) : null}

      <Opciones etiqueta="Fórmula" opciones={formulas.map(f => f.id)} nombres={nombresDe(formulas)} valor={formulaId} onChange={id => aplicarFormula(id)} />
      {formula?.notas ? <Text style={styles.ayuda}>{formula.notas}</Text> : null}
      <Campo etiqueta="Masa total de la mezcla (g)" value={masaTotal} onChangeText={cambiarMasa} keyboardType="decimal-pad" placeholder="Ej: 150" ayuda="Al cambiarla se reescala la fórmula" />

      <Text style={styles.etiqueta}>Ingredientes (g)</Text>
      {filas.map((f, i) => (
        <View key={f.ingredienteId} style={styles.fila}>
          <Text style={styles.ingNombre}>{nombreIngrediente[f.ingredienteId] ?? f.ingredienteId}</Text>
          <View style={styles.ingCampo}><Campo etiqueta="" value={f.gramos} onChangeText={t => cambiarGramos(i, t)} keyboardType="decimal-pad" placeholder="g" /></View>
          <TouchableOpacity onPress={() => quitar(i)} hitSlop={8}><Text style={styles.quitar}>✕</Text></TouchableOpacity>
        </View>
      ))}
      <View style={styles.chips}>
        {ingredientes.filter(i => !filas.some(f => f.ingredienteId === i.id)).map(i => (
          <BotonChico key={i.id} texto={`+ ${i.nombre}`} color={colores.textoSuave} onPress={() => agregarIngrediente(i.id)} />
        ))}
      </View>

      <View style={styles.fila}>
        <View style={{ flex: 1 }}><Campo etiqueta="Peso por esfera (g)" value={pesoPildora} onChangeText={setPesoPildora} keyboardType="decimal-pad" /></View>
        <View style={{ flex: 1 }}><Campo etiqueta="Diámetro (mm)" value={diametro} onChangeText={setDiametro} keyboardType="decimal-pad" ayuda="Canica grande: 20–30 mm" /></View>
      </View>

      {lista.length ? (
        <Tarjeta>
          <Text style={styles.resumen}>{balance.masaTotalG} g de mezcla → {esferas} esferas de {pesoPildora} g</Text>
          <Text style={styles.subtitulo}>Composición estimada (balance de masa, base seca)</Text>
          {Object.entries(balance.componentes).filter(([, c]) => c.gramos > 0).map(([comp, c]) => (
            <Barra key={comp} etiqueta={`${NOMBRE_COMPONENTE[comp] ?? comp} · ${c.gramos} g`} valor={c.porcentaje} max={maxComp} sufijo=" %" />
          ))}
          {Object.keys(consumo).length ? (
            <Text style={styles.detalle}>
              Toma del inventario: {Object.entries(consumo).map(([r, kg]) => `${kg} kg de ${NOMBRE_RECURSO[r] ?? r}`).join(' · ')}
            </Text>
          ) : null}
        </Tarjeta>
      ) : null}
      {faltantes.length ? (
        <Aviso texto={`No alcanza el inventario: ${faltantes.map(([r, kg]) => `${NOMBRE_RECURSO[r] ?? r} (necesitas ${kg} kg, hay ${inventario?.[r as keyof InventarioBiomasa] ?? 0} kg)`).join('; ')}. Regístralo en Acopio → Biomasa.`} />
      ) : null}
      {num(diametro) && (num(diametro) < 20 || num(diametro) > 30) ? <Aviso tipo="info" texto="El documento recomienda esferas de 2 a 3 cm (20–30 mm)." /> : null}

      <OpcionesMultiples
        etiqueta="Inóculo / aditivos biológicos"
        opciones={(cat?.aditivos ?? []).map(a => a.id)}
        nombres={nombresDe(cat?.aditivos)}
        valores={aditivos}
        onChange={setAditivos}
      />
      {aditivos.length ? (
        <Campo etiqueta="Detalle del inóculo" value={aditivosDetalle} onChangeText={setAditivosDetalle} placeholder="Ej: micorrizas de suelo forestal, 5 g por kg de mezcla" />
      ) : null}
      <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline placeholder="Ej: secado a la sombra, charola 3" />
      <Boton texto="Crear lote" color={colores.azul} onPress={enviar} cargando={enviando} />

      {data?.lotes.length ? <Seccion>Lotes</Seccion> : null}
      {[...(data?.lotes ?? [])].reverse().map((l: Lote) => (
        <Tarjeta key={l.id}>
          <Text style={styles.nombre}>{l.codigo} · {nombreEspecie[l.especieId] ?? l.especieId} · {l.cantidad} esferas</Text>
          <Text style={styles.detalle}>
            {l.ingredientes?.length
              ? l.ingredientes.map(i => `${nombreIngrediente[i.ingredienteId] ?? i.ingredienteId} ${i.gramos} g`).join(' · ')
              : `arcilla ${l.arcillaPct ?? '–'}% · compost ${l.compostPct ?? '–'}% · ficus ${l.ficusPct ?? '–'}%`}
          </Text>
          {l.composicion ? (
            <Text style={styles.detalle}>
              {['celulosa', 'hemicelulosa', 'lignina', 'polifenoles']
                .filter(c => l.composicion!.componentes[c]?.porcentaje)
                .map(c => `${NOMBRE_COMPONENTE[c]?.split(' ')[0] ?? c} ${l.composicion!.componentes[c].porcentaje}%`).join(' · ')}
            </Text>
          ) : null}
          <Text style={styles.detalle}>
            {l.diametroMm ? `${l.diametroMm} mm · ` : ''}{l.aditivos?.length ? `+ ${l.aditivos.map(a => nombresDe(cat?.aditivos)[a] ?? a).join(', ')} · ` : ''}{fecha(l.creadoEn)}
          </Text>
          {l.advertencia ? <Text style={styles.advertencia}>⚠️ {l.advertencia}</Text> : null}
        </Tarjeta>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto, marginBottom: 6 },
  ayuda: { fontSize: 12, color: colores.textoSuave, marginTop: -8, marginBottom: 12 },
  fila: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  ingNombre: { flex: 2, fontSize: 13, color: colores.texto },
  ingCampo: { flex: 1 },
  quitar: { fontSize: 18, color: colores.rojo, paddingHorizontal: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  resumen: { fontSize: 15, fontWeight: '700', color: colores.azul, marginBottom: 8 },
  subtitulo: { fontSize: 13, fontWeight: '600', color: colores.texto, marginBottom: 8 },
  nombre: { fontSize: 15, fontWeight: '600', color: colores.texto, marginBottom: 4 },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  advertencia: { fontSize: 12, color: colores.ambar, marginTop: 4 },
});
