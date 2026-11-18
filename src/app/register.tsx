import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthLayout } from '../components/AuthLayout';
import { ErrorText, Field, PrimaryButton } from '../components/ui';
import { useSession } from '../session';
import { colors, fonts } from '../theme';

function formatCpf(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** Valida os dígitos verificadores do CPF. */
function isValidCpf(value: string) {
  const d = value.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const check = (len: number) => {
    const sum = d.slice(0, len).split('').reduce((acc, n, i) => acc + Number(n) * (len + 1 - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}

export default function RegisterScreen() {
  const { register } = useSession();
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!isValidCpf(cpf)) return setError('CPF inválido.');
    if (name.trim().split(/\s+/).length < 2) return setError('Informe seu nome completo.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('E-mail inválido.');
    if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.');
    if (password !== confirm) return setError('As senhas não conferem.');
    const failure = register({ cpf: cpf.replace(/\D/g, ''), name: name.trim(), email, password });
    // Se deu certo, o Stack.Protected do layout raiz leva para as abas.
    if (failure) return setError(failure);
  }

  return (
    <AuthLayout>
      <Text style={styles.title}>
        <Text style={styles.bold}>Cadastre-se</Text> e comece a acumular pontos!
      </Text>
      <Field placeholder="CPF" keyboardType="number-pad" value={cpf} onChangeText={(v) => setCpf(formatCpf(v))} />
      <Field placeholder="Nome completo" autoCapitalize="words" value={name} onChangeText={setName} />
      <Field placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <Field placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />
      <Field placeholder="Confirme a senha" secureTextEntry value={confirm} onChangeText={setConfirm} onSubmitEditing={submit} />
      <ErrorText>{error}</ErrorText>
      <PrimaryButton onPress={submit} style={styles.button}>
        Entrar
      </PrimaryButton>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Já possui conta? </Text>
        <Link href="/login" style={styles.link}>
          Login
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink, marginBottom: 4 },
  bold: { fontFamily: fonts.bold },
  button: { marginTop: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  footerText: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  link: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
});
