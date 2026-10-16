import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { alerta, confirmar } from '@/lib/alerta';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Rol, Usuario } from '@/lib/types';
import { DESCRIPCION_ROL, NOMBRE_ROL, ROLES } from '@/lib/catalogos';
import { Aviso, BotonChico, colores, fecha, Pantalla, Seccion, Tarjeta } from '@/components/ui';

// Panel de administración: lista de usuarios, cambiar rol, eliminar
export default function Admin() {
  const { usuario: yo, esAdmin } = useUsuario();
  const { data: usuarios, error, recargar } = useData(api.usuarios);

  if (!esAdmin) {
    return (
      <Pantalla titulo="Administración">
        <Aviso texto="Solo los administradores pueden ver esta pantalla." />
      </Pantalla>
    );
  }

  const cambiarRol = async (u: Usuario, rol: Rol) => {
    if (rol === u.rol) return;
    const ok = await confirmar(`Cambiar a ${NOMBRE_ROL[rol]}`, `${u.email}: ${DESCRIPCION_ROL[rol]}.`, 'Confirmar');
    if (!ok) return;
    try {
      await api.cambiarRol(u.id, rol);
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    }
  };

  const eliminar = async (u: Usuario) => {
    if (!(await confirmar('Eliminar usuario', `¿Eliminar la cuenta ${u.email}? Sus registros se conservan.`))) return;
    try {
      await api.eliminarUsuario(u.id);
      recargar();
    } catch (e) {
      alerta('Error', (e as Error).message);
    }
  };


  const fila = (u: Usuario) => (
    <Tarjeta key={u.id}>
      <Text style={styles.email}>{u.email}{u.id === yo?.id ? ' (tú)' : ''}</Text>
      <Text style={styles.detalle}>{NOMBRE_ROL[u.rol] ?? u.rol}{u.creadoEn ? ` · desde ${fecha(u.creadoEn)}` : ''}</Text>
      {u.id !== yo?.id ? (
        <View style={styles.acciones}>
          {ROLES.map(r => (
            <BotonChico key={r} texto={NOMBRE_ROL[r]} relleno={u.rol === r} onPress={() => cambiarRol(u, r)} />
          ))}
          <BotonChico texto="Eliminar" color={colores.rojo} onPress={() => eliminar(u)} />
        </View>
      ) : null}
    </Tarjeta>
  );

  return (
    <Pantalla titulo="Administración ⚙️" subtitulo={`${usuarios?.length ?? 0} usuarios registrados`}>
      {error ? <Aviso texto={error} /> : null}
      <Tarjeta>
        {ROLES.map(r => (
          <Text key={r} style={styles.detalle}><Text style={styles.email}>{NOMBRE_ROL[r]}</Text>: {DESCRIPCION_ROL[r]}</Text>
        ))}
      </Tarjeta>
      {ROLES.map(r => {
        const lista = (usuarios ?? []).filter(u => u.rol === r);
        return lista.length ? (
          <View key={r}>
            <Seccion>{NOMBRE_ROL[r]} ({lista.length})</Seccion>
            {lista.map(fila)}
          </View>
        ) : null;
      })}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  email: { fontSize: 15, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap' },
});
