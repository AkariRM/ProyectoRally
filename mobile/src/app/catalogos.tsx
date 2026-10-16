import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api, NombreCatalogo } from '@/lib/api';
import { alerta, confirmar } from '@/lib/alerta';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Especie, Formula, Ingrediente, ItemCatalogo, Prueba, RecursoBiomasa } from '@/lib/types';
import { NOMBRE_COMPONENTE, NOMBRE_RECURSO } from '@/lib/balance';
import { nombresDe } from '@/lib/catalogos';
import { Aviso, Boton, BotonChico, Campo, colores, Opciones, Pantalla, Tarjeta } from '@/components/ui';

type Seccion = 'especies' | NombreCatalogo;

const SECCIONES: Seccion[] = ['especies', 'formulas', 'ingredientes', 'tratamientos', 'pruebas', 'aditivos', 'tiposMaterial'];
const NOMBRES: Record<Seccion, string> = {
  especies: '🌳 Especies',
  formulas: '⚖️ Fórmulas',
  ingredientes: '🧱 Ingredientes',
  tratamientos: '🧪 Tratamientos',
  pruebas: '📏 Pruebas',
  aditivos: '🦠 Aditivos',
  tiposMaterial: '🍂 Tipos de material',
};
const AYUDA: Record<Seccion, string> = {
  especies: 'Especies nativas para las píldoras. Marca "validada" cuando Bioquímica la apruebe.',
  formulas: 'Mezclas en porcentaje (deben sumar 100). Al crear un lote se escalan a la masa que se vaya a preparar.',
  ingredientes: 'Insumos de la mezcla. Las fracciones (0–1, base seca) alimentan el balance de masa; "se toma del inventario" descuenta la biomasa.',
  tratamientos: 'Mezclas que se comparan en los ensayos de laboratorio.',
  pruebas: 'Pruebas de laboratorio. Las de retención, pérdida de agua y germinación tienen calculadora en la app; las nuevas se capturan como valor directo.',
  aditivos: 'Aditivos biológicos que se pueden agregar a un lote.',
  tiposMaterial: 'Tipo de poda que se registra en entregas, solicitudes y jornadas.',
};

// Formulario de especie
function FormEspecie({ especie, onListo, onCancelar }: { especie?: Especie; onListo: () => void; onCancelar: () => void }) {
  const [nombreComun, setNombreComun] = useState(especie?.nombreComun ?? '');
  const [nombreCientifico, setNombreCientifico] = useState(especie?.nombreCientifico ?? '');
  const [tipo, setTipo] = useState(especie?.tipo ?? '');
  const [temporada, setTemporada] = useState(especie?.temporadaSiembra ?? '');
  const [tratamiento, setTratamiento] = useState(especie?.tratamientoPregerminativo ?? '');
  const [notas, setNotas] = useState(especie?.notas ?? '');
  const [validada, setValidada] = useState<'sí' | 'no'>(especie?.validada ? 'sí' : 'no');
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    setEnviando(true);
    const datos: Partial<Especie> = {
      nombreComun, nombreCientifico, tipo, temporadaSiembra: temporada,
      tratamientoPregerminativo: tratamiento, notas, validada: validada === 'sí',
    };
    try {
      if (especie) await api.editarEspecie(especie.id, datos);
      else await api.crearEspecie(datos);
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta style={styles.form}>
      <Text style={styles.formTitulo}>{especie ? `Editar: ${especie.nombreComun}` : 'Nueva especie'}</Text>
      <Campo etiqueta="Nombre común" value={nombreComun} onChangeText={setNombreComun} placeholder="Ej: Encino" />
      <Campo etiqueta="Nombre científico" value={nombreCientifico} onChangeText={setNombreCientifico} placeholder="Ej: Quercus castanea" />
      <Campo etiqueta="Tipo" value={tipo} onChangeText={setTipo} placeholder="árbol, arbusto, leguminosa…" />
      <Campo etiqueta="Temporada de siembra" value={temporada} onChangeText={setTemporada} placeholder="Junio–julio (inicio de lluvias)" />
      <Campo etiqueta="Tratamiento pregerminativo" value={tratamiento} onChangeText={setTratamiento} placeholder="Escarificación, remojo 24 h…" />
      <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline />
      <Opciones etiqueta="¿Validada por Bioquímica?" opciones={['sí', 'no'] as const} valor={validada} onChange={setValidada} />
      <Boton texto={especie ? 'Guardar cambios' : 'Agregar especie'} onPress={guardar} cargando={enviando} />
      <Boton texto="Cancelar" onPress={onCancelar} secundario color={colores.textoSuave} />
    </Tarjeta>
  );
}

// Formulario genérico para tratamientos, pruebas, aditivos y tipos de material
function FormItem({ catalogo, item, onListo, onCancelar }: {
  catalogo: NombreCatalogo; item?: ItemCatalogo & Partial<Prueba>; onListo: () => void; onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(item?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? '');
  const [unidad, setUnidad] = useState(item?.unidad ?? '');
  const [instrucciones, setInstrucciones] = useState(item?.instrucciones ?? '');
  const [enviando, setEnviando] = useState(false);
  const esPrueba = catalogo === 'pruebas';
  const conDescripcion = catalogo === 'tratamientos' || catalogo === 'aditivos';

  const guardar = async () => {
    setEnviando(true);
    const datos: Partial<Prueba> = { nombre };
    if (conDescripcion) datos.descripcion = descripcion;
    if (esPrueba) Object.assign(datos, { unidad, instrucciones });
    try {
      if (item) await api.editarEnCatalogo(catalogo, item.id, datos);
      else await api.crearEnCatalogo(catalogo, datos);
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta style={styles.form}>
      <Text style={styles.formTitulo}>{item ? `Editar: ${item.nombre}` : `Agregar a ${NOMBRES[catalogo]}`}</Text>
      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} />
      {conDescripcion ? <Campo etiqueta="Descripción" value={descripcion} onChangeText={setDescripcion} multiline /> : null}
      {esPrueba ? (
        <>
          <Campo etiqueta="Unidad" value={unidad} onChangeText={setUnidad} placeholder="%, g, mm, min, °C, num…" />
          <Campo etiqueta="Instrucciones" value={instrucciones} onChangeText={setInstrucciones} multiline placeholder="Cómo se mide, con qué material" />
        </>
      ) : null}
      <Boton texto={item ? 'Guardar cambios' : 'Agregar'} onPress={guardar} cargando={enviando} />
      <Boton texto="Cancelar" onPress={onCancelar} secundario color={colores.textoSuave} />
    </Tarjeta>
  );
}

const RECURSOS: RecursoBiomasa[] = ['triturada', 'biochar', 'harina'];

// Ingrediente: nombre, inventario del que se descuenta y fracciones para el balance de masa
function FormIngrediente({ item, componentes, onListo, onCancelar }: {
  item?: Ingrediente; componentes: string[]; onListo: () => void; onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(item?.nombre ?? '');
  const [recurso, setRecurso] = useState<RecursoBiomasa | 'ninguno'>(item?.recurso ?? 'ninguno');
  const [fracciones, setFracciones] = useState<Record<string, string>>(
    Object.fromEntries(componentes.map(c => [c, item?.fracciones?.[c] !== undefined ? String(item.fracciones[c]) : ''])),
  );
  const [notas, setNotas] = useState(item?.notas ?? '');
  const [enviando, setEnviando] = useState(false);
  const suma = Object.values(fracciones).reduce((t, v) => t + (Number(v) || 0), 0);

  const guardar = async () => {
    setEnviando(true);
    const datos: Partial<Ingrediente> = {
      nombre,
      notas,
      recurso: recurso === 'ninguno' ? null : recurso,
      fracciones: Object.fromEntries(Object.entries(fracciones).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)])),
    };
    try {
      if (item) await api.editarEnCatalogo('ingredientes', item.id, datos);
      else await api.crearEnCatalogo('ingredientes', datos);
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta style={styles.form}>
      <Text style={styles.formTitulo}>{item ? `Editar: ${item.nombre}` : 'Nuevo ingrediente'}</Text>
      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} />
      <Opciones
        etiqueta="Se toma del inventario de biomasa"
        opciones={['ninguno', ...RECURSOS] as const}
        nombres={{ ninguno: 'Ninguno', ...NOMBRE_RECURSO }}
        valor={recurso}
        onChange={setRecurso}
      />
      <Text style={styles.etiqueta}>Fracciones en base seca (0 a 1) · suma {Math.round(suma * 1000) / 1000}</Text>
      <View style={styles.rejilla}>
        {componentes.map(c => (
          <View key={c} style={styles.celda}>
            <Campo
              etiqueta={NOMBRE_COMPONENTE[c] ?? c}
              value={fracciones[c]}
              onChangeText={t => setFracciones(f => ({ ...f, [c]: t }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
        ))}
      </View>
      {suma > 1 ? <Aviso texto="Las fracciones no pueden sumar más de 1." /> : null}
      <Campo etiqueta="Notas / fuente" value={notas} onChangeText={setNotas} multiline />
      <Boton texto={item ? 'Guardar cambios' : 'Agregar ingrediente'} onPress={guardar} cargando={enviando} />
      <Boton texto="Cancelar" onPress={onCancelar} secundario color={colores.textoSuave} />
    </Tarjeta>
  );
}

// Fórmula: lista de ingredientes con su porcentaje (suma 100)
function FormFormula({ item, ingredientes, onListo, onCancelar }: {
  item?: Formula; ingredientes: Ingrediente[]; onListo: () => void; onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(item?.nombre ?? '');
  const [masa, setMasa] = useState(item?.masaTotalG ? String(item.masaTotalG) : '150');
  const [filas, setFilas] = useState<{ ingredienteId: string; porcentaje: string }[]>(
    item?.ingredientes.map(i => ({ ingredienteId: i.ingredienteId, porcentaje: String(i.porcentaje) })) ?? [],
  );
  const [notas, setNotas] = useState(item?.notas ?? '');
  const [enviando, setEnviando] = useState(false);
  const nombreIng = nombresDe(ingredientes);
  const suma = filas.reduce((t, f) => t + (Number(f.porcentaje) || 0), 0);
  const masaN = Number(masa) || 0;

  const guardar = async () => {
    setEnviando(true);
    const datos: Partial<Formula> = {
      nombre,
      notas,
      masaTotalG: masaN || undefined,
      ingredientes: filas.map(f => ({ ingredienteId: f.ingredienteId, porcentaje: Number(f.porcentaje) })),
    };
    try {
      if (item) await api.editarEnCatalogo('formulas', item.id, datos);
      else await api.crearEnCatalogo('formulas', datos);
      onListo();
    } catch (e) {
      alerta('Error', (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Tarjeta style={styles.form}>
      <Text style={styles.formTitulo}>{item ? `Editar: ${item.nombre}` : 'Nueva fórmula'}</Text>
      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} />
      <Campo etiqueta="Masa de referencia (g)" value={masa} onChangeText={setMasa} keyboardType="decimal-pad" />
      <Text style={styles.etiqueta}>Ingredientes · suma {Math.round(suma * 100) / 100} %</Text>
      {filas.map((f, i) => (
        <View key={f.ingredienteId} style={styles.filaIng}>
          <Text style={styles.ingNombre}>{nombreIng[f.ingredienteId] ?? f.ingredienteId}</Text>
          <View style={styles.ingCampo}>
            <Campo
              etiqueta=""
              value={f.porcentaje}
              onChangeText={t => setFilas(fs => fs.map((x, j) => (j === i ? { ...x, porcentaje: t } : x)))}
              keyboardType="decimal-pad"
              placeholder="%"
            />
          </View>
          <Text style={styles.gramos}>{masaN ? `${Math.round(((masaN * (Number(f.porcentaje) || 0)) / 100) * 10) / 10} g` : ''}</Text>
          <BotonChico texto="✕" color={colores.rojo} onPress={() => setFilas(fs => fs.filter((_, j) => j !== i))} />
        </View>
      ))}
      <View style={styles.acciones}>
        {ingredientes.filter(i => !filas.some(f => f.ingredienteId === i.id)).map(i => (
          <BotonChico key={i.id} texto={`+ ${i.nombre}`} color={colores.textoSuave} onPress={() => setFilas(fs => [...fs, { ingredienteId: i.id, porcentaje: '' }])} />
        ))}
      </View>
      {filas.length && Math.abs(suma - 100) > 0.5 ? <Aviso texto="Los porcentajes deben sumar 100." /> : null}
      <Campo etiqueta="Notas" value={notas} onChangeText={setNotas} multiline />
      <Boton texto={item ? 'Guardar cambios' : 'Agregar fórmula'} onPress={guardar} cargando={enviando} />
      <Boton texto="Cancelar" onPress={onCancelar} secundario color={colores.textoSuave} />
    </Tarjeta>
  );
}

export default function Catalogos() {
  const { esAdmin } = useUsuario();
  const [seccion, setSeccion] = useState<Seccion>('especies');
  const [editando, setEditando] = useState<string | 'nuevo' | null>(null);
  const { data, error, recargar } = useData(async () => {
    const [catalogos, especies] = await Promise.all([api.catalogos(), api.especies()]);
    return { catalogos, especies };
  });

  if (!esAdmin) {
    return (
      <Pantalla titulo="Catálogos">
        <Aviso texto="Solo los administradores pueden editar los catálogos." />
      </Pantalla>
    );
  }

  const terminar = () => {
    setEditando(null);
    recargar();
  };

  const cambiarSeccion = (s: Seccion) => {
    setSeccion(s);
    setEditando(null);
  };

  const eliminar = async (nombre: string, borrar: () => Promise<unknown>) => {
    if (!(await confirmar('Eliminar', `¿Eliminar "${nombre}"?`))) return;
    try {
      await borrar();
      recargar();
    } catch (e) {
      alerta('No se pudo eliminar', (e as Error).message);
    }
  };

  const items: (ItemCatalogo & Partial<Prueba & Ingrediente & Formula>)[] =
    seccion === 'especies' ? [] : ((data?.catalogos[seccion] ?? []) as (ItemCatalogo & Partial<Prueba & Ingrediente & Formula>)[]);
  const ingredientes = data?.catalogos.ingredientes ?? [];
  const nombreIng = nombresDe(ingredientes);

  // Formulario según la sección (item = editar; sin item = nuevo)
  const formulario = (item?: ItemCatalogo) => {
    const cancelar = () => setEditando(null);
    if (seccion === 'ingredientes') {
      return <FormIngrediente key={item?.id} item={item as Ingrediente} componentes={data?.catalogos.componentes ?? []} onListo={terminar} onCancelar={cancelar} />;
    }
    if (seccion === 'formulas') {
      return <FormFormula key={item?.id} item={item as Formula} ingredientes={ingredientes} onListo={terminar} onCancelar={cancelar} />;
    }
    return <FormItem key={item?.id} catalogo={seccion as NombreCatalogo} item={item} onListo={terminar} onCancelar={cancelar} />;
  };

  // Detalle de cada elemento en la lista
  const detalle = (i: ItemCatalogo & Partial<Prueba & Ingrediente & Formula>) => {
    if (seccion === 'ingredientes') {
      const fr = Object.entries(i.fracciones ?? {}).filter(([, v]) => v > 0);
      return (
        <>
          <Text style={styles.detalle}>{i.recurso ? `Se toma de: ${NOMBRE_RECURSO[i.recurso]}` : 'No descuenta inventario'}</Text>
          <Text style={styles.detalle}>
            {fr.length ? fr.map(([k, v]) => `${NOMBRE_COMPONENTE[k]?.split(' ')[0] ?? k} ${v}`).join(' · ') : 'Sin fracciones registradas'}
          </Text>
          {i.notas ? <Text style={styles.detalle}>{i.notas}</Text> : null}
        </>
      );
    }
    if (seccion === 'formulas') {
      return (
        <>
          <Text style={styles.detalle}>
            {(i.ingredientes ?? []).map(x => `${nombreIng[x.ingredienteId] ?? x.ingredienteId} ${x.porcentaje}%`
              + (i.masaTotalG ? ` (${Math.round(((i.masaTotalG * x.porcentaje) / 100) * 10) / 10} g)` : '')).join(' · ')}
          </Text>
          {i.notas ? <Text style={styles.detalle}>{i.notas}</Text> : null}
        </>
      );
    }
    return (
      <>
        {i.descripcion ? <Text style={styles.detalle}>{i.descripcion}</Text> : null}
        {i.instrucciones ? <Text style={styles.detalle}>{i.instrucciones}</Text> : null}
      </>
    );
  };

  return (
    <Pantalla titulo="Catálogos ⚙️" subtitulo="Especies, tratamientos, pruebas y opciones de los formularios">
      {error ? <Aviso texto={error} /> : null}
      <Opciones etiqueta="" opciones={SECCIONES} nombres={NOMBRES} valor={seccion} onChange={cambiarSeccion} />
      <Aviso tipo="info" texto={AYUDA[seccion]} />

      {editando !== 'nuevo' ? <BotonChico texto="+ Agregar" relleno onPress={() => setEditando('nuevo')} /> : null}
      {editando === 'nuevo' ? (
        seccion === 'especies'
          ? <FormEspecie onListo={terminar} onCancelar={() => setEditando(null)} />
          : formulario()
      ) : null}

      {seccion === 'especies'
        ? (data?.especies ?? []).map(e => editando === e.id ? (
          <FormEspecie key={e.id} especie={e} onListo={terminar} onCancelar={() => setEditando(null)} />
        ) : (
          <Tarjeta key={e.id} style={styles.fila}>
            <Text style={styles.nombre}>{e.nombreComun} {e.validada ? '✅' : ''}</Text>
            <Text style={styles.detalle}><Text style={styles.cursiva}>{e.nombreCientifico}</Text>{e.tipo ? ` · ${e.tipo}` : ''}</Text>
            {e.tratamientoPregerminativo ? <Text style={styles.detalle}>Tratamiento: {e.tratamientoPregerminativo}</Text> : null}
            {e.notas ? <Text style={styles.detalle}>{e.notas}</Text> : null}
            <View style={styles.acciones}>
              <BotonChico texto="✏️ Editar" onPress={() => setEditando(e.id)} />
              <BotonChico texto="🗑️ Eliminar" color={colores.rojo} onPress={() => eliminar(e.nombreComun, () => api.eliminarEspecie(e.id))} />
            </View>
          </Tarjeta>
        ))
        : items.map(i => editando === i.id ? (
          formulario(i)
        ) : (
          <Tarjeta key={i.id} style={styles.fila}>
            <Text style={styles.nombre}>{i.nombre}{i.unidad ? ` (${i.unidad})` : ''}{i.calculada ? ' 🧮' : ''}</Text>
            {detalle(i)}
            <View style={styles.acciones}>
              <BotonChico texto="✏️ Editar" onPress={() => setEditando(i.id)} />
              <BotonChico
                texto="🗑️ Eliminar"
                color={colores.rojo}
                onPress={() => eliminar(i.nombre, () => api.eliminarDeCatalogo(seccion, i.id))}
              />
            </View>
          </Tarjeta>
        ))}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: 8 },
  formTitulo: { fontSize: 16, fontWeight: '700', color: colores.verde, marginBottom: 10 },
  fila: { marginTop: 8 },
  nombre: { fontSize: 15, fontWeight: '700', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  cursiva: { fontStyle: 'italic' },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto, marginBottom: 6 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  celda: { width: '47%' },
  filaIng: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ingNombre: { flex: 2, fontSize: 13, color: colores.texto },
  ingCampo: { flex: 1 },
  gramos: { width: 64, fontSize: 12, color: colores.textoSuave, textAlign: 'right' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap' },
});
