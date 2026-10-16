import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UsuarioProvider } from '@/lib/usuario';
import { colores } from '@/components/ui';
import { configurarAvisos } from '@/lib/avisos';

configurarAvisos();

export default function RootLayout() {
  return (
    <UsuarioProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerTintColor: colores.verde }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="seguimiento/[id]" options={{ title: 'Seguimiento' }} />
      </Stack>
    </UsuarioProvider>
  );
}
