import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../session';
import { colors, fonts, spacing } from '../theme';

export const assets = {
  hero: require('../../assets/images/hero.png'),
  coin: require('../../assets/images/coin.png'),
  validation: require('../../assets/images/validation.png'),
  successTree: require('../../assets/images/success-tree.png'),
  scanFab: require('../../assets/icons/scan-fab.png'),
  gallery: require('../../assets/icons/gallery.png'),
  upload: require('../../assets/icons/upload.png'),
};

export function Logo({ size = 30, color = colors.primary }: { size?: number; color?: string }) {
  return <Text style={[styles.logo, { fontSize: size, color }]}>ReLoop</Text>;
}

export function Coin({ size = 18 }: { size?: number }) {
  return <Image source={assets.coin} style={{ width: size * 1.15, height: size }} resizeMode="contain" />;
}

export function formatPoints(value: number) {
  return value.toLocaleString('pt-BR');
}

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { balance } = useSession();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Minha conta" onPress={() => router.push('/account')} hitSlop={8}>
        <Logo />
      </Pressable>
      <View style={styles.headerPoints}>
        <Coin size={28} />
        <Text style={styles.headerPointsText}>{formatPoints(balance)}</Text>
      </View>
    </View>
  );
}

/** Tela padrão com cabeçalho do Figma (logo + saldo). */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.screen}>
      <AppHeader />
      {children}
    </View>
  );
}

/** Botão verde flutuante que abre o leitor de QR code. */
export function ScanFab() {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Escanear QR code do dispositivo" onPress={() => router.push('/scan')} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}>
      <Image source={assets.scanFab} style={styles.fabImage} />
    </Pressable>
  );
}

export function Field({ label, containerStyle, ...props }: TextInputProps & { label?: string; containerStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />
    </View>
  );
}

/** Campo de seleção (dropdown) no estilo do formulário do Figma. */
export function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={[styles.input, styles.select]}>
        <Text style={styles.selectText}>{value}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.ink} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={styles.modalOption}
                >
                  <Text style={[styles.modalOptionText, item === value && styles.modalOptionActive]}>{item}</Text>
                  {item === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export function PrimaryButton({ children, onPress, loading = false, disabled = false, style }: { children: ReactNode; onPress?: () => void; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.primaryButton, (disabled || loading) && { opacity: 0.55 }, pressed && { opacity: 0.85 }, style]}
    >
      {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>{children}</Text>}
    </Pressable>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={styles.errorText}>{children}</Text>;
}

/** Quadradinhos 2x2 que mostram quanto espaço resta no compartimento. */
export function CapacityGrid({ occupancy }: { occupancy: number }) {
  const filled = Math.round(occupancy / 25);
  return (
    <View style={styles.capacityGrid} accessibilityLabel={`Ocupação de ${occupancy}%`}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.capacityCell, i < filled && styles.capacityCellFilled]} />
      ))}
    </View>
  );
}

export function DistanceRow({ label }: { label: string }) {
  return (
    <View style={styles.distanceRow}>
      <Ionicons name="navigate" size={12} color={colors.accent} style={{ transform: [{ rotate: '-45deg' }] }} />
      <Text style={styles.distanceText}>{label}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  logo: { fontFamily: fonts.brand, letterSpacing: -0.5 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.primary },
  headerPoints: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerPointsText: { fontFamily: fonts.brand, fontSize: 28, color: colors.primary },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 64, height: 64, borderRadius: 32, elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  fabImage: { width: 64, height: 64 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink },
  input: { height: 44, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 3, paddingHorizontal: 12, fontFamily: fonts.regular, fontSize: 14, color: colors.ink, backgroundColor: colors.surface },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingVertical: spacing.md, maxHeight: '60%' },
  modalTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#EEE' },
  modalOptionText: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  modalOptionActive: { fontFamily: fonts.semibold, color: colors.primary },
  primaryButton: { height: 54, backgroundColor: colors.primary, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryButtonText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.surface },
  errorText: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger },
  capacityGrid: { width: 42, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  capacityCell: { width: 19, height: 19, backgroundColor: colors.block },
  capacityCellFilled: { backgroundColor: colors.primary },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distanceText: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink },
});
