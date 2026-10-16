import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UsuarioProvider, useUsuario } from '@/lib/usuario';
import { colores } from '@/components/ui';
import { configurarAvisos } from '@/lib/avisos';

configurarAvisos();

// Sin sesión solo existe la pantalla de login; con sesión, el resto de la app.
function Navegacion() {
  const { usuario, esAdmin, cargando } = useUsuario();

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.verdeClaro }}>
        <ActivityIndicator size="large" color={colores.verde} />
      </View>
    );
  }

  return (
    // Sin encabezado nativo: cada pantalla trae su propio botón "‹ Atrás"
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={!!usuario} redirectTo="/login">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="seguimiento/[id]" />
        <Stack.Protected guard={esAdmin} redirectTo="/">
          <Stack.Screen name="admin" />
          <Stack.Screen name="catalogos" />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <UsuarioProvider>
      <StatusBar style="dark" />
      <Navegacion />
    </UsuarioProvider>
  );
}
