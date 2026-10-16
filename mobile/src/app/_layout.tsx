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
    <Stack screenOptions={{ headerTintColor: colores.verde }}>
      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!usuario} redirectTo="/login">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="seguimiento/[id]" options={{ title: 'Seguimiento' }} />
        <Stack.Protected guard={esAdmin} redirectTo="/">
          <Stack.Screen name="admin" options={{ title: 'Administración' }} />
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
