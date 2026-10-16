import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { api, NombreCatalogo } from '@/lib/api';
import { alerta, confirmar } from '@/lib/alerta';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Especie, ItemCatalogo, Prueba } from '@/lib/types';
import { Aviso, Boton, BotonChico, Campo, colores, Opciones, Pantalla, Tarjeta } from '@/components/ui';

type Seccion = 'especies' | NombreCatalogo;

const SECCIONES: Seccion[] = ['especies', 'tratamientos', 'pruebas', 'aditivos', 'tiposMaterial'];
const NOMBRES: Record<Seccion, string> = {
  especies: '🌳 Especies',
  tratamientos: '🧪 Tratamientos',
  pruebas: '📏 Pruebas',
  aditivos: '🦠 Aditivos',
  tiposMaterial: '🍂 Tipos de material',
};
const AYUDA: Record<Seccion, string> = {
  especies: 'Especies nativas para las píldoras. Marca "validada" cuando Bioquímica la apruebe.',
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

  const items: (ItemCatalogo & Partial<Prueba>)[] = seccion === 'especies' ? [] : data?.catalogos[seccion] ?? [];

  return (
    <Pantalla titulo="Catálogos ⚙️" subtitulo="Especies, tratamientos, pruebas y opciones de los formularios">
      {error ? <Aviso texto={error} /> : null}
      <Opciones etiqueta="" opciones={SECCIONES} nombres={NOMBRES} valor={seccion} onChange={cambiarSeccion} />
      <Aviso tipo="info" texto={AYUDA[seccion]} />

      {editando !== 'nuevo' ? <BotonChico texto="+ Agregar" relleno onPress={() => setEditando('nuevo')} /> : null}
      {editando === 'nuevo' ? (
        seccion === 'especies'
          ? <FormEspecie onListo={terminar} onCancelar={() => setEditando(null)} />
          : <FormItem catalogo={seccion} onListo={terminar} onCancelar={() => setEditando(null)} />
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
          <FormItem key={i.id} catalogo={seccion} item={i} onListo={terminar} onCancelar={() => setEditando(null)} />
        ) : (
          <Tarjeta key={i.id} style={styles.fila}>
            <Text style={styles.nombre}>{i.nombre}{i.unidad ? ` (${i.unidad})` : ''}{i.calculada ? ' 🧮' : ''}</Text>
            {i.descripcion ? <Text style={styles.detalle}>{i.descripcion}</Text> : null}
            {i.instrucciones ? <Text style={styles.detalle}>{i.instrucciones}</Text> : null}
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
  acciones: { flexDirection: 'row', flexWrap: 'wrap' },
});
