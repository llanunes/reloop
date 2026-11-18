// Visual padrão das telas internas do app (tudo depois do login): cantos arredondados, cards e cabeçalho com o logo ReLoop.
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../session';
import { fonts } from '../theme';

export const legacyColors = {
  ink: '#1C2823',
  muted: '#6E7B74',
  primary: '#2F6B40',
  primaryDark: '#1D4D2D',
  mint: '#DFF4E2',
  accent: '#45C675',
  lime: '#DDF2A8',
  paper: '#FBFCFA',
  surface: '#FFFFFF',
  line: '#E3EAE3',
  warning: '#C47B21',
  warningSoft: '#FFF2D9',
  success: '#257A46',
  successSoft: '#E4F6E8',
  shadow: '#183B28',
};
const c = legacyColors;

export const legacySpacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30, xxl: 40 };
export const legacyRadius = { sm: 10, md: 16, lg: 24, pill: 999 };

/** Todos os botões do app usam a mesma altura e o mesmo arredondamento. */
export const BUTTON_HEIGHT = 54;
export const BUTTON_RADIUS = 18;

export function Icon({ name, size = 22, color = c.ink, family = 'ionicons' }: { name: string; size?: number; color?: string; family?: 'ionicons' | 'material' }) {
  if (family === 'material') return <MaterialCommunityIcons name={name as never} size={size} color={color} />;
  return <Ionicons name={name as never} size={size} color={color} />;
}

/** Logo "ReLoop" do Figma (fonte Antonio, verde). */
function BrandMark() {
  return <Text style={styles.brandName}>ReLoop</Text>;
}

export function PointsBalance() {
  const { balance } = useSession();
  return (
    <View style={styles.pointsBalance}>
      <View style={styles.pointsIcon}>
        <Icon name="leaf" family="material" size={15} color={c.primaryDark} />
      </View>
      <View>
        <Text style={styles.pointsLabel}>saldo</Text>
        <Text style={styles.pointsValue}>{balance.toLocaleString('pt-BR')} pts</Text>
      </View>
    </View>
  );
}

export function LegacyHeader({ title, subtitle, onNotification }: { title?: string; subtitle?: string; onNotification?: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dialog = useDialog();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <View style={styles.headerTitleBlock}>
        <BrandMark />
        {title && <Text style={styles.headerTitle}>{title}</Text>}
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.headerActions}>
        <PointsBalance />
        <Pressable accessibilityRole="button" accessibilityLabel="Notificações" onPress={onNotification ?? (() => dialog({ title: 'Tudo em dia', message: 'Você não tem novas notificações.', icon: 'notifications-outline' }))} style={styles.headerIconButton}>
          <Icon name="notifications-outline" size={20} color={c.primaryDark} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Minha conta" onPress={() => router.push('/account')} style={styles.headerIconButton}>
          <Icon name="person-outline" size={20} color={c.primaryDark} />
        </Pressable>
      </View>
    </View>
  );
}

export function LegacyButton({ children, onPress, icon, loading = false, style }: { children: ReactNode; onPress?: () => void; icon?: string; loading?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" disabled={loading} onPress={onPress} style={({ pressed }) => [styles.primaryButton, loading && { opacity: 0.6 }, pressed && { transform: [{ scale: 0.98 }] }, style]}>
      {loading ? <ActivityIndicator color={c.surface} /> : <Text style={styles.primaryButtonText}>{children}</Text>}
      {icon && !loading && <Icon name={icon} size={19} color={c.surface} />}
    </Pressable>
  );
}

export function SecondaryButton({ children, onPress, icon, style }: { children: ReactNode; onPress?: () => void; icon?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.8 }, style]}>
      {icon && <Icon name={icon} size={18} color={c.primary} />}
      <Text style={styles.secondaryButtonText}>{children}</Text>
    </Pressable>
  );
}

/**
 * Tela interna padrão: cabeçalho ReLoop, conteúdo rolável no meio e,
 * opcionalmente, um rodapé fixo com os botões de ação (sempre no mesmo lugar, acima da barra de abas).
 */
export function AppScreen({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <View style={styles.screen}>
      <LegacyHeader title={title} subtitle={subtitle} />
      <View style={styles.body}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={c.muted} {...props} style={[styles.input, props.editable === false && styles.inputReadonly, props.style]} />
    </View>
  );
}

export function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={[styles.input, styles.select]}>
        <Text style={styles.selectText}>{value}</Text>
        <Icon name="chevron-down" size={18} color={c.primary} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const active = item === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                    style={[styles.option, active && styles.optionActive]}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{item}</Text>
                    {active && <Icon name="checkmark-circle" size={20} color={c.primary} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <View style={styles.errorBox}>
      <Icon name="alert-circle" size={16} color="#B64A4A" />
      <Text style={styles.errorText}>{children}</Text>
    </View>
  );
}

export type LegacyPoint = {
  name: string;
  address: string;
  distance: string;
  status: 'Aberto' | 'Fechado';
  hours: string;
  occupancy: number;
};

function StatusChip({ label, tone }: { label: string; tone: 'success' | 'neutral' }) {
  const success = tone === 'success';
  return (
    <View style={[styles.statusChip, { backgroundColor: success ? c.successSoft : '#EEF1EF' }]}>
      <View style={[styles.statusDot, { backgroundColor: success ? c.success : c.muted }]} />
      <Text style={[styles.statusText, { color: success ? c.success : c.muted }]}>{label}</Text>
    </View>
  );
}

function CapacityDots({ occupancy }: { occupancy: number }) {
  return (
    <View style={styles.capacityDots} accessibilityLabel={`Capacidade estimada em ${occupancy}%`}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={[styles.capacityDot, item < Math.ceil(occupancy / 25) && styles.capacityDotActive]} />
      ))}
    </View>
  );
}

export function EcoPointCard({ point, selected, onPress }: { point: LegacyPoint; selected?: boolean; onPress?: () => void }) {
  const open = point.status === 'Aberto';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.ecoCard, selected && styles.ecoCardSelected, pressed && { opacity: 0.84 }]}>
      <View style={styles.ecoCardTop}>
        <View style={styles.ecoCardIcon}>
          <Icon name="location" size={19} color={c.primary} />
        </View>
        <View style={styles.ecoCardTitleBlock}>
          <Text style={styles.ecoCardTitle}>{point.name}</Text>
          <Text style={styles.ecoCardAddress}>{point.address}</Text>
        </View>
        <Icon name="chevron-forward" size={18} color={c.muted} />
      </View>
      <View style={styles.ecoCardDivider} />
      <View style={styles.ecoCardBottom}>
        <View style={styles.ecoCardMeta}>
          <Icon name="navigate" size={15} color={c.accent} />
          <Text style={styles.ecoCardMetaText}>{point.distance}</Text>
          <Text style={styles.ecoCardMetaMuted}>{point.hours}</Text>
        </View>
        <View style={styles.ecoCardStatusBlock}>
          <StatusChip label={point.status} tone={open ? 'success' : 'neutral'} />
          <CapacityDots occupancy={point.occupancy} />
        </View>
      </View>
    </Pressable>
  );
}

export const shared = StyleSheet.create({
  card: { borderRadius: 16, backgroundColor: c.surface, padding: 16, borderWidth: 1, borderColor: c.line, shadowColor: c.shadow, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  title: { color: c.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  text: { color: c.muted, fontSize: 13, lineHeight: 19 },
});

// ---------------------------------------------------------------------------
// Diálogo do app: substitui as caixas nativas do Android (Alert.alert) por um painel
// no mesmo visual das telas. Uso: const dialog = useDialog(); dialog({ title, message, buttons }).
// ---------------------------------------------------------------------------
export type DialogButton = { text: string; style?: 'default' | 'cancel' | 'destructive'; icon?: string; onPress?: () => void };
export type DialogOptions = { title: string; message?: string; icon?: string; tone?: 'default' | 'success' | 'danger'; buttons?: DialogButton[] };

const DialogContext = createContext<(options: DialogOptions) => void>(() => {});

export function useDialog() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const show = useCallback((options: DialogOptions) => setDialog(options), []);

  const buttons = dialog?.buttons?.length ? dialog.buttons : [{ text: 'Entendi' }];
  const cancel = buttons.find((b) => b.style === 'cancel');
  const actions = buttons.filter((b) => b.style !== 'cancel');
  // Fechar tocando fora (ou no voltar do Android) conta como "cancelar"; com um botão só, conta como ele.
  const dismiss = cancel ?? (actions.length === 1 ? actions[0] : undefined);

  function close(button?: DialogButton) {
    setDialog(null);
    // Espera o painel fechar antes da ação (ex.: abrir câmera ou galeria).
    if (button?.onPress) setTimeout(button.onPress, 250);
  }

  const tone = dialog?.tone ?? 'default';
  const toneColors = { default: { bg: c.mint, fg: c.primary }, success: { bg: c.successSoft, fg: c.success }, danger: { bg: '#FDE8E8', fg: '#B64A4A' } }[tone];

  return (
    <DialogContext.Provider value={show}>
      {children}
      <Modal visible={!!dialog} transparent animationType="slide" onRequestClose={() => close(dismiss)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => close(dismiss)}>
          {dialog && (
            <Pressable style={[styles.sheet, styles.dialogSheet]} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <View style={[styles.dialogIcon, { backgroundColor: toneColors.bg }]}>
                <Icon name={dialog.icon ?? (tone === 'danger' ? 'alert-circle-outline' : tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline')} size={28} color={toneColors.fg} />
              </View>
              <Text style={styles.dialogTitle}>{dialog.title}</Text>
              {dialog.message && <Text style={styles.dialogMessage}>{dialog.message}</Text>}
              <View style={styles.dialogButtons}>
                {actions.map((button, index) =>
                  index === 0 ? (
                    <LegacyButton key={button.text} icon={button.icon} onPress={() => close(button)} style={button.style === 'destructive' && { backgroundColor: '#B64A4A' }}>
                      {button.text}
                    </LegacyButton>
                  ) : (
                    <SecondaryButton key={button.text} icon={button.icon} onPress={() => close(button)}>
                      {button.text}
                    </SecondaryButton>
                  ),
                )}
                {cancel && (
                  <Pressable accessibilityRole="button" onPress={() => close(cancel)} style={styles.dialogCancel}>
                    <Text style={styles.dialogCancelText}>{cancel.text}</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.paper },
  body: { flex: 1 },
  footer: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 14, gap: 10, backgroundColor: c.paper, borderTopWidth: 1, borderTopColor: c.line },
  secondaryButton: { minHeight: BUTTON_HEIGHT, paddingHorizontal: 18, borderRadius: BUTTON_RADIUS, borderWidth: 1.5, borderColor: c.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.surface },
  secondaryButtonText: { color: c.primary, fontSize: 14, fontWeight: '800' },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: c.ink, fontSize: 13, fontWeight: '700' },
  input: { minHeight: 50, borderRadius: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, paddingHorizontal: 15, color: c.ink, fontSize: 15 },
  inputReadonly: { backgroundColor: '#F2F5F2', color: c.muted },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { color: c.ink, fontSize: 15, flex: 1 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: c.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 30, maxHeight: '65%', gap: 6 },
  dialogSheet: { alignItems: 'center', paddingBottom: 26 },
  dialogIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 6 },
  dialogTitle: { color: c.ink, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  dialogMessage: { color: c.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 2, maxWidth: 320 },
  dialogButtons: { alignSelf: 'stretch', gap: 10, marginTop: 18 },
  dialogCancel: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  dialogCancelText: { color: c.muted, fontSize: 14, fontWeight: '800' },
  sheetHandle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: c.line, marginBottom: 6 },
  sheetTitle: { color: c.ink, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, marginBottom: 6, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
  optionActive: { backgroundColor: c.mint, borderColor: c.primary },
  optionText: { color: c.ink, fontSize: 14 },
  optionTextActive: { color: c.primaryDark, fontWeight: '800' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 11, borderRadius: 10, backgroundColor: '#FDE8E8' },
  errorText: { color: '#B64A4A', fontSize: 12, fontWeight: '700', flex: 1 },
  brandName: { fontFamily: fonts.brand, color: c.primary, fontSize: 30, lineHeight: 36, letterSpacing: -0.5 },
  header: { paddingHorizontal: 22, paddingBottom: 16, backgroundColor: c.paper, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.line },
  headerTitleBlock: { gap: 7, flex: 1 },
  headerTitle: { color: c.ink, fontSize: 22, fontWeight: '800', marginTop: 7 },
  headerSubtitle: { color: c.muted, fontSize: 13, lineHeight: 18 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerIconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.line },
  pointsBalance: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pointsIcon: { width: 27, height: 27, borderRadius: 14, backgroundColor: c.lime, alignItems: 'center', justifyContent: 'center' },
  pointsLabel: { color: c.muted, fontSize: 10, lineHeight: 11 },
  pointsValue: { color: c.primaryDark, fontSize: 13, fontWeight: '800' },
  primaryButton: { minHeight: BUTTON_HEIGHT, backgroundColor: c.primary, borderRadius: BUTTON_RADIUS, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: c.shadow, shadowOpacity: 0.13, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  primaryButtonText: { color: c.surface, fontSize: 15, fontWeight: '800' },
  statusChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  ecoCard: { borderRadius: 16, backgroundColor: c.surface, padding: 16, borderWidth: 1, borderColor: c.line, gap: 12, shadowColor: c.shadow, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  ecoCardSelected: { borderColor: c.primary },
  ecoCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ecoCardIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: c.mint, alignItems: 'center', justifyContent: 'center' },
  ecoCardTitleBlock: { flex: 1, gap: 3 },
  ecoCardTitle: { color: c.ink, fontSize: 15, fontWeight: '800' },
  ecoCardAddress: { color: c.muted, fontSize: 12 },
  ecoCardDivider: { height: 1, backgroundColor: c.line },
  ecoCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 },
  ecoCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  ecoCardMetaText: { color: c.ink, fontSize: 12, fontWeight: '800' },
  ecoCardMetaMuted: { color: c.muted, fontSize: 11, marginLeft: 5 },
  ecoCardStatusBlock: { alignItems: 'flex-end', gap: 6 },
  capacityDots: { flexDirection: 'row', gap: 3 },
  capacityDot: { width: 7, height: 7, borderRadius: 2, backgroundColor: '#D9E0DA' },
  capacityDotActive: { backgroundColor: c.primary },
});
