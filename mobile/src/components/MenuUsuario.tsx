import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useUsuario } from '@/lib/usuario';
import { NOMBRE_ROL } from '@/lib/catalogos';
import { confirmar } from '@/lib/alerta';
import { colores } from '@/components/ui';

function Atajo({ icono, texto, onPress }: { icono: React.ComponentProps<typeof FontAwesome>['name']; texto: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.atajo} onPress={onPress} accessibilityRole="button" accessibilityLabel={texto}>
      <Text style={styles.atajoTexto}>{texto}</Text>
      <View style={styles.atajoIcono}>
        <FontAwesome name={icono} size={18} color={colores.texto} />
      </View>
    </TouchableOpacity>
  );
}

// Esquina superior derecha del dashboard: saludo con el ícono del usuario (abre el
// menú para cerrar sesión) y, debajo, la tuerca de configuración y los catálogos.
export default function MenuUsuario() {
  const { usuario, esAdmin, salir } = useUsuario();
  const [abierto, setAbierto] = useState(false);
  if (!usuario) return null;
  const nombre = usuario.email.split('@')[0];

  const cerrarSesion = async () => {
    setAbierto(false);
    if (await confirmar('Cerrar sesión', `¿Salir de la cuenta ${usuario.email}?`, 'Cerrar sesión')) salir();
  };

  const ir = (ruta: '/admin' | '/catalogos') => {
    setAbierto(false);
    router.push(ruta);
  };

  return (
    <View style={styles.columna}>
      <TouchableOpacity style={styles.saludo} onPress={() => setAbierto(true)} accessibilityRole="button" accessibilityLabel="Menú de la cuenta">
        <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
          <Text style={styles.hola} numberOfLines={1}>Hola, {nombre}</Text>
          <Text style={styles.rol}>{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</Text>
        </View>
        <View style={styles.avatar}>
          <FontAwesome name={esAdmin ? 'user-secret' : 'user'} size={20} color="#fff" />
        </View>
      </TouchableOpacity>

      {esAdmin ? (
        <>
          <Atajo icono="cog" texto="Configuración" onPress={() => ir('/admin')} />
          <Atajo icono="book" texto="Catálogos" onPress={() => ir('/catalogos')} />
        </>
      ) : null}

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable style={styles.fondo} onPress={() => setAbierto(false)}>
          <Pressable style={styles.menu}>
            <View style={styles.menuCabecera}>
              <View style={[styles.avatar, { width: 44, height: 44, borderRadius: 22 }]}>
                <FontAwesome name={esAdmin ? 'user-secret' : 'user'} size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuNombre} numberOfLines={1}>{nombre}</Text>
                <Text style={styles.menuEmail} numberOfLines={1}>{usuario.email}</Text>
                <Text style={styles.rol}>{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</Text>
              </View>
            </View>
            {esAdmin ? (
              <>
                <TouchableOpacity style={styles.opcion} onPress={() => ir('/admin')}>
                  <FontAwesome name="cog" size={16} color={colores.texto} />
                  <Text style={styles.opcionTexto}>Configuración y usuarios</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.opcion} onPress={() => ir('/catalogos')}>
                  <FontAwesome name="book" size={16} color={colores.texto} />
                  <Text style={styles.opcionTexto}>Catálogos</Text>
                </TouchableOpacity>
              </>
            ) : null}
            <TouchableOpacity style={[styles.opcion, styles.salir]} onPress={cerrarSesion}>
              <FontAwesome name="sign-out" size={16} color={colores.rojo} />
              <Text style={[styles.opcionTexto, { color: colores.rojo }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  columna: { alignItems: 'flex-end', gap: 8, marginLeft: 12, maxWidth: 190 },
  saludo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hola: { fontSize: 15, fontWeight: '700', color: colores.texto },
  rol: { fontSize: 12, color: colores.verde },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colores.verde, alignItems: 'center', justifyContent: 'center' },
  atajo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  atajoIcono: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colores.borde,
  },
  atajoTexto: { fontSize: 12, color: colores.textoSuave },
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'flex-end', paddingTop: 60, paddingHorizontal: 16 },
  menu: {
    width: 270, maxWidth: '100%', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 8, elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  menuCabecera: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuNombre: { fontSize: 16, fontWeight: '700', color: colores.texto },
  menuEmail: { fontSize: 12, color: colores.textoSuave },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  opcionTexto: { fontSize: 15, color: colores.texto },
  salir: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 4 },
});
