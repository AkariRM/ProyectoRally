import { StyleSheet, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { alerta, confirmar } from '@/lib/alerta';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Usuario } from '@/lib/types';
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

  const cambiarRol = async (u: Usuario) => {
    const rol = u.rol === 'admin' ? 'voluntario' : 'admin';
    const ok = await confirmar(
      rol === 'admin' ? 'Hacer administrador' : 'Quitar administrador',
      `${u.email} ${rol === 'admin' ? 'podrá modificar puntos, zonas y usuarios.' : 'dejará de ser administrador.'}`,
      'Confirmar',
    );
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

  const admins = (usuarios ?? []).filter(u => u.rol === 'admin');
  const voluntarios = (usuarios ?? []).filter(u => u.rol !== 'admin');

  const fila = (u: Usuario) => (
    <Tarjeta key={u.id}>
      <Text style={styles.email}>{u.email}{u.id === yo?.id ? ' (tú)' : ''}</Text>
      <Text style={styles.detalle}>{u.rol === 'admin' ? '⭐ Administrador' : 'Voluntario'}{u.creadoEn ? ` · desde ${fecha(u.creadoEn)}` : ''}</Text>
      {u.id !== yo?.id ? (
        <View style={styles.acciones}>
          <BotonChico texto={u.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'} onPress={() => cambiarRol(u)} />
          <BotonChico texto="Eliminar" color={colores.rojo} onPress={() => eliminar(u)} />
        </View>
      ) : null}
    </Tarjeta>
  );

  return (
    <Pantalla titulo="Administración ⚙️" subtitulo={`${usuarios?.length ?? 0} usuarios registrados`}>
      {error ? <Aviso texto={error} /> : null}
      <Aviso tipo="info" texto="Los administradores pueden agregar, editar y eliminar puntos de acopio, zonas de poda y jornadas, y administrar usuarios." />
      <Seccion>Administradores</Seccion>
      {admins.map(fila)}
      <Seccion>Voluntarios</Seccion>
      {voluntarios.length ? voluntarios.map(fila) : <Text style={styles.detalle}>Aún no hay voluntarios registrados.</Text>}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  email: { fontSize: 15, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap' },
});
