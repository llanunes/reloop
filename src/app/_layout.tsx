import { Antonio_400Regular } from '@expo-google-fonts/antonio';
import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DialogProvider } from '../components/legacy';
import { SessionProvider, useSession } from '../session';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Antonio_400Regular, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <DialogProvider>
          <RootNavigator />
        </DialogProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

/**
 * Controle de acesso (Stack.Protected): ao entrar ou sair, o próprio roteador leva para a área certa.
 * O endereço "/" é a aba de Ecopontos; o login fica em "/login". Não crie outro "index" fora das abas,
 * senão dois arquivos disputam o "/" e a navegação entra em loop.
 */
function RootNavigator() {
  const { user } = useSession();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}
