import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, LegacyButton, useDialog, legacyColors as colors, LegacyHeader, legacyRadius as radius, legacySpacing as spacing, PointsBalance } from '../../components/legacy';
import { useSession } from '../../session';

type Reward = { id: string; title: string; subtitle: string; points: number; icon: string; tone: string; iconColor: string };
const rewards: Reward[] = [
  { id: 'prime', title: 'Desconto Prime', subtitle: '1 mês de assinatura', points: 4000, icon: 'play-circle', tone: '#DCEBFF', iconColor: '#1B73D1' },
  { id: 'pilhas', title: 'Pilhas recarregáveis', subtitle: 'Kit Duracell AA', points: 15000, icon: 'battery-charging', tone: '#FFF1B9', iconColor: '#AF7B00' },
  { id: 'cinema', title: 'Ingresso de cinema', subtitle: 'Sessão de terça-feira', points: 8000, icon: 'movie-open-outline', tone: '#E8DFFF', iconColor: '#7653B7' },
  { id: 'copo', title: 'Copo reutilizável', subtitle: 'Edição ReLoop', points: 6500, icon: 'cup', tone: '#D7F3E5', iconColor: '#26855B' },
];

const categories = ['Todos', 'Descontos', 'Produtos', 'Resgatados'];
const isDiscount = (item: Reward) => item.title.includes('Desconto') || item.title.includes('Ingresso');

export default function RewardsScreen() {
  const { balance, redeem, redemptions } = useSession();
  const dialog = useDialog();
  const [category, setCategory] = useState('Todos');
  const showingRedeemed = category === 'Resgatados';
  const visibleRewards = category === 'Todos' ? rewards : rewards.filter((item) => (category === 'Descontos' ? isDiscount(item) : !isDiscount(item)));

  function onRedeem(reward: Reward) {
    if (!redeem(reward)) {
      dialog({ title: 'Ainda faltam pontos', message: `Você precisa de mais ${(reward.points - balance).toLocaleString('pt-BR')} pontos para resgatar este benefício.`, icon: 'leaf-outline' });
      return;
    }
    dialog({ title: 'Resgate confirmado!', message: `${reward.title} foi adicionado aos seus resgates. Veja no filtro "Resgatados".`, tone: 'success', icon: 'gift-outline' });
  }

  return (
    <View style={styles.screen}>
      <LegacyHeader title="Benefícios" subtitle="Troque seus pontos por recompensas" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceCopy}>
            <Text style={styles.balanceEyebrow}>seu saldo disponível</Text>
            <Text style={styles.balanceNumber}>{balance.toLocaleString('pt-BR')}</Text>
            <Text style={styles.balanceUnit}>pontos</Text>
          </View>
          <View style={styles.balanceOrb}>
            <MaterialCommunityIcons name="leaf" size={44} color={colors.primaryDark} />
            <View style={styles.orbRing} />
          </View>
        </View>

        <View style={styles.impactRow}>
          <View style={styles.impactIcon}>
            <Icon name="recycle" family="material" size={19} color={colors.primary} />
          </View>
          <Text style={styles.impactText}>
            Você já ajudou a desviar <Text style={styles.impactStrong}>12,4 kg</Text> de resíduos do lixo comum.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Adquira benefícios</Text>
            <Text style={styles.sectionSubtitle}>Escolha uma recompensa para você</Text>
          </View>
          <PointsBalance />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}>
              {item === 'Resgatados' && <Icon name="checkmark-done" size={14} color={category === item ? colors.surface : colors.muted} />}
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
                {item}
                {item === 'Resgatados' && redemptions.length > 0 ? ` (${redemptions.length})` : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {showingRedeemed ? (
          <RedeemedList />
        ) : (
        <View style={styles.grid}>
          {visibleRewards.map((reward) => (
            <View key={reward.title} style={styles.rewardCard}>
              <View style={[styles.rewardImage, { backgroundColor: reward.tone }]}>
                <MaterialCommunityIcons name={reward.icon as never} size={49} color={reward.iconColor} />
                <View style={styles.rewardBadge}>
                  <Icon name="leaf" family="material" size={11} color={colors.primaryDark} />
                  <Text style={styles.rewardBadgeText}>{reward.points.toLocaleString('pt-BR')}</Text>
                </View>
              </View>
              <View style={styles.rewardBody}>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardSubtitle}>{reward.subtitle}</Text>
                <LegacyButton style={styles.rewardButton} onPress={() => onRedeem(reward)}>
                  Resgatar
                </LegacyButton>
              </View>
            </View>
          ))}
        </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatDate(date: Date) {
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day} às ${time}`;
}

/** Histórico de benefícios já resgatados, do mais recente para o mais antigo. */
function RedeemedList() {
  const { redemptions } = useSession();

  if (!redemptions.length) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Icon name="gift-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Nenhum resgate ainda</Text>
        <Text style={styles.emptyText}>Quando você trocar seus pontos por um benefício, ele aparece aqui.</Text>
      </View>
    );
  }

  const total = redemptions.reduce((sum, item) => sum + item.points, 0);
  return (
    <View style={styles.redeemedList}>
      <Text style={styles.redeemedSummary}>
        {redemptions.length} {redemptions.length === 1 ? 'resgate' : 'resgates'} · {total.toLocaleString('pt-BR')} pontos trocados
      </Text>
      {redemptions.map((item) => {
        const reward = rewards.find((r) => r.id === item.rewardId);
        return (
          <View key={item.id} style={styles.redeemedCard}>
            <View style={[styles.redeemedImage, { backgroundColor: reward?.tone ?? colors.mint }]}>
              <MaterialCommunityIcons name={(reward?.icon ?? 'gift-outline') as never} size={28} color={reward?.iconColor ?? colors.primary} />
            </View>
            <View style={styles.redeemedInfo}>
              <Text style={styles.rewardTitle}>{item.title}</Text>
              <Text style={styles.redeemedDate}>{formatDate(item.date)}</Text>
              <View style={styles.redeemedPoints}>
                <Icon name="leaf" family="material" size={11} color={colors.primaryDark} />
                <Text style={styles.rewardBadgeText}>-{item.points.toLocaleString('pt-BR')} pts</Text>
              </View>
            </View>
            <View style={styles.redeemedStatus}>
              <Icon name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.redeemedStatusText}>Resgatado</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: 36, gap: spacing.md },
  balanceCard: { minHeight: 150, borderRadius: radius.lg, backgroundColor: colors.primary, padding: spacing.lg, overflow: 'hidden', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceCopy: { gap: 2 },
  balanceEyebrow: { color: colors.mint, fontSize: 12, fontWeight: '700' },
  balanceNumber: { color: colors.surface, fontSize: 42, lineHeight: 49, fontWeight: '800', letterSpacing: -1 },
  balanceUnit: { color: colors.lime, fontSize: 13, fontWeight: '800' },
  balanceOrb: { width: 103, height: 103, borderRadius: 52, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-13deg' }], marginRight: -6 },
  orbRing: { position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)' },
  impactRow: { padding: 13, borderRadius: radius.md, backgroundColor: colors.mint, flexDirection: 'row', alignItems: 'center', gap: 10 },
  impactIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  impactText: { color: colors.primaryDark, fontSize: 12, lineHeight: 17, flex: 1 },
  impactStrong: { fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  categories: { flexDirection: 'row', gap: 8 },
  category: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  categoryActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  categoryTextActive: { color: colors.surface },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  rewardCard: { width: '48%', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: colors.surface, overflow: 'hidden' },
  rewardImage: { height: 130, alignItems: 'center', justifyContent: 'center' },
  rewardBadge: { position: 'absolute', left: 9, bottom: 9, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardBadgeText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' },
  rewardBody: { padding: 11, gap: 4 },
  rewardTitle: { color: colors.ink, fontSize: 13, lineHeight: 16, fontWeight: '800' },
  rewardSubtitle: { color: colors.muted, fontSize: 10, minHeight: 14 },
  empty: { alignItems: 'center', padding: spacing.xl, gap: 8, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 260 },
  redeemedList: { gap: 11 },
  redeemedSummary: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  redeemedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  redeemedImage: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  redeemedInfo: { flex: 1, gap: 3 },
  redeemedDate: { color: colors.muted, fontSize: 11 },
  redeemedPoints: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  redeemedStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.successSoft },
  redeemedStatusText: { color: colors.success, fontSize: 10, fontWeight: '800' },
  rewardButton: { minHeight: 40, borderRadius: 14, marginTop: 6, paddingHorizontal: 8 },
});
