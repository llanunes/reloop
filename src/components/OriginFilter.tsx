import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { legacyColors as colors } from './legacy';

/** Campos "Endereço" e "Distância" do Figma, mais o botão de usar a localização atual. */
export function OriginFilter({
  address,
  onAddressChange,
  onSubmitAddress,
  onLocate,
  locating,
  radiusKm,
  onRadiusChange,
  error,
}: {
  address: string;
  onAddressChange: (v: string) => void;
  onSubmitAddress: () => void;
  onLocate: () => void;
  locating: boolean;
  radiusKm: string;
  onRadiusChange: (v: string) => void;
  error: string | null;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.addressCol}>
          <Text style={styles.label}>Endereço</Text>
          <View style={styles.inputBox}>
            <TextInput style={styles.input} value={address} onChangeText={onAddressChange} onSubmitEditing={onSubmitAddress} returnKeyType="search" placeholder="Digite um endereço" placeholderTextColor={colors.muted} />
            <Pressable accessibilityLabel="Usar minha localização" onPress={onLocate} hitSlop={8}>
              {locating ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="locate-outline" size={19} color={colors.primary} />}
            </Pressable>
          </View>
        </View>
        <View style={styles.distanceCol}>
          <Text style={styles.label}>Distância</Text>
          <View style={styles.inputBox}>
            <TextInput style={styles.input} value={radiusKm} onChangeText={(v) => onRadiusChange(v.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" />
            <Text style={styles.km}>KM</Text>
          </View>
        </View>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', gap: 10 },
  addressCol: { flex: 1, gap: 6 },
  distanceCol: { width: 96, gap: 6 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  inputBox: { height: 50, borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 8 },
  input: { flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 0 },
  km: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  error: { color: '#B64A4A', fontSize: 12, fontWeight: '700' },
});
