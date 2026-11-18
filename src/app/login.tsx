import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthLayout } from '../components/AuthLayout';
import { ErrorText, Field, PrimaryButton } from '../components/ui';
import { useSession } from '../session';
import { colors, fonts } from '../theme';

export default function LoginScreen() {
  const { login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    const failure = login(email, password);
    // Se deu certo, o Stack.Protected do layout raiz leva para as abas.
    if (failure) setError(failure);
  }

  return (
    <AuthLayout>
      <Text style={styles.title}>
        Já possui uma conta? Faça <Text style={styles.bold}>Login</Text>
      </Text>
      <Field placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={setEmail} />
      <Field placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={submit} />
      <ErrorText>{error}</ErrorText>
      <PrimaryButton onPress={submit} style={styles.button}>
        Entrar
      </PrimaryButton>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Não tem uma conta? </Text>
        <Link href="/register" style={styles.link}>
          Cadastre-se
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink, marginBottom: 4 },
  bold: { fontFamily: fonts.bold },
  button: { marginTop: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  footerText: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  link: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
});
