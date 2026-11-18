import { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { assets, Logo } from './ui';

/** Layout das telas de Login e Cadastro: ilustração no topo com o logo e o formulário abaixo. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Image source={assets.hero} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.logoWrap}>
            <Logo size={52} color={colors.surface} />
          </View>
        </View>
        <View style={styles.form}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  content: { flexGrow: 1 },
  hero: { width: '100%', aspectRatio: 1.05, backgroundColor: colors.hero, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  logoWrap: { position: 'absolute', bottom: 8, left: 0, right: 0, alignItems: 'center' },
  form: { paddingHorizontal: 40, paddingTop: 32, paddingBottom: 40, gap: 18 },
});
