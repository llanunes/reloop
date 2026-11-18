import { Redirect, useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen, Icon, LegacyButton, legacyColors as colors, legacyRadius as radius, legacySpacing as spacing, shared } from '../../components/legacy';
import { assets } from '../../components/ui';
import { useSession } from '../../session';

export default function ValidatedScreen() {
  const router = useRouter();
  const { disposal } = useSession();
  if (!disposal?.points) return <Redirect href="/scan" />;

  return (
    <AppScreen
      title="Validação concluída"
      subtitle="Agora é só depositar os itens"
      footer={
        // Sem integração com a balança do dispositivo, o usuário confirma quando terminar.
        <LegacyButton onPress={() => router.replace('/weighed')} icon="arrow-forward">
          Já inseri os itens
        </LegacyButton>
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[shared.card, styles.card]}>
          <View style={styles.illustration}>
            <Image source={assets.validation} style={styles.image} resizeMode="contain" />
          </View>
          <View style={styles.check}>
            <Icon name="checkmark" size={28} color={colors.surface} />
          </View>
          <Text style={[shared.title, styles.center]}>Validação dos itens concluída!</Text>
          <Text style={[shared.text, styles.center]}>Insira seus itens no compartimento aberto do dispositivo de coleta. Depois disso, eles serão pesados para calcular seus pontos.</Text>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Resumo do descarte</Text>
          <Text style={styles.summaryValue}>
            {disposal.quantity}× {disposal.itemName} · {disposal.model}
          </Text>
          <Text style={styles.summaryPoints}>≈ {disposal.points.toLocaleString('pt-BR')} pts</Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 36, gap: spacing.md },
  card: { alignItems: 'center', gap: 10, padding: spacing.lg, borderRadius: radius.lg },
  illustration: { width: '100%', borderRadius: radius.md, backgroundColor: colors.mint, alignItems: 'center', paddingVertical: spacing.lg },
  image: { width: '80%', height: 170 },
  check: { width: 56, height: 56, borderRadius: 28, marginTop: -38, backgroundColor: colors.accent, borderWidth: 4, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  summary: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.lime, gap: 3 },
  summaryLabel: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  summaryValue: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  summaryPoints: { color: colors.primaryDark, fontSize: 12 },
});
