import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen, Icon, useDialog, LegacyButton, legacyColors as colors, legacyRadius as radius, legacySpacing as spacing } from '../../components/legacy';
import { useSession } from '../../session';

function maskCpf(cpf: string) {
  const d = cpf.replace(/\D/g, '');
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : '—';
}

export default function AccountScreen() {
  const { user, isAdmin, balance, logout } = useSession();
  const dialog = useDialog();
  if (!user) return null;

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  function confirmLogout() {
    dialog({
      title: 'Sair da conta',
      message: 'Tem certeza que deseja sair?',
      icon: 'log-out-outline',
      tone: 'danger',
      buttons: [
        // O Stack.Protected do layout raiz leva de volta para o login.
        { text: 'Sair', style: 'destructive', onPress: logout },
        { text: 'Cancelar', style: 'cancel' },
      ],
    });
  }

  return (
    <AppScreen
      title="Minha conta"
      subtitle="Seus dados e sessão"
      footer={
        <LegacyButton style={styles.logoutButton} onPress={confirmLogout} icon="log-out-outline">
          Sair da conta
        </LegacyButton>
      }
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <View style={[styles.roleChip, isAdmin && styles.roleChipAdmin]}>
            <Text style={[styles.roleText, isAdmin && styles.roleTextAdmin]}>{isAdmin ? 'Administrador' : 'Usuário'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="mail-outline" label="E-mail" value={user.email} />
          <View style={styles.divider} />
          <InfoRow icon="card-outline" label="CPF" value={maskCpf(user.cpf)} />
          <View style={styles.divider} />
          <InfoRow icon="leaf-outline" label="Saldo" value={`${balance.toLocaleString('pt-BR')} pts`} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 36, gap: spacing.md },
  profileCard: { alignItems: 'center', gap: 8, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.primary },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primaryDark, fontSize: 28, fontWeight: '800' },
  name: { color: colors.surface, fontSize: 20, fontWeight: '800', marginTop: 4 },
  roleChip: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.18)' },
  roleChipAdmin: { backgroundColor: colors.lime },
  roleText: { color: colors.surface, fontSize: 11, fontWeight: '800' },
  roleTextAdmin: { color: colors.primaryDark },
  infoCard: { borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: colors.muted, fontSize: 11 },
  infoValue: { color: colors.ink, fontSize: 14, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.line },
  logoutButton: { backgroundColor: '#B64A4A' },
});
