import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen, LegacyButton, legacyColors as colors, legacyRadius as radius, legacySpacing as spacing, SecondaryButton, shared } from '../../components/legacy';
import { assets } from '../../components/ui';
import { useSession } from '../../session';

export default function WeighedScreen() {
  const router = useRouter();
  const { completeDisposal } = useSession();
  const [earned, setEarned] = useState(0);

  // Credita os pontos ao abrir a tela. Depois disso o descarte é encerrado,
  // então chamadas seguintes retornam 0 e não creditam de novo.
  useFocusEffect(
    useCallback(() => {
      const value = completeDisposal();
      if (value) setEarned(value);
    }, [completeDisposal]),
  );

  return (
    <AppScreen
      title="Tudo certo!"
      subtitle="Sua contribuição foi registrada"
      footer={
        <>
          <LegacyButton onPress={() => router.replace('/scan')} icon="recycle">
            Fazer novo descarte
          </LegacyButton>
          <SecondaryButton onPress={() => router.replace('/rewards')} icon="gift-outline">
            Trocar meus pontos
          </SecondaryButton>
        </>
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[shared.card, styles.card]}>
          <View style={styles.illustration}>
            <Image source={assets.successTree} style={styles.image} resizeMode="contain" />
          </View>
          <Text style={[shared.title, styles.center]}>Pesagem concluída!</Text>
          <Text style={[shared.text, styles.center]}>O planeta agradece a sua contribuição. Seus pontos já foram depositados na sua conta.</Text>
        </View>

        <View style={styles.earned}>
          <Text style={styles.earnedLabel}>Você ganhou</Text>
          <Text style={styles.earnedValue}>+{earned.toLocaleString('pt-BR')} pts</Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 36, gap: spacing.md },
  card: { alignItems: 'center', gap: 10, padding: spacing.lg, borderRadius: radius.lg },
  illustration: { width: '100%', borderRadius: radius.md, backgroundColor: colors.mint, alignItems: 'center', paddingVertical: spacing.md },
  image: { width: 130, height: 210 },
  center: { textAlign: 'center' },
  earned: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.lime, gap: 2 },
  earnedLabel: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  earnedValue: { color: colors.primaryDark, fontSize: 32, fontWeight: '800' },
});
