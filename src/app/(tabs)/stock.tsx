import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen, Icon, legacyColors as colors, legacyRadius as radius, legacySpacing as spacing, shared } from '../../components/legacy';
import { OriginFilter } from '../../components/OriginFilter';
import { distanceKm, ecopoints } from '../../data/ecopoints';
import { useOrigin } from '../../hooks/useOrigin';

/** A partir desta ocupação o ecoponto aparece com "Coleta necessária". */
const COLLECTION_THRESHOLD = 75;

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} km`;
}

export default function StockScreen() {
  const { origin, address, setAddress, searchAddress, locateMe, locating, error } = useOrigin();
  const [radiusKm, setRadiusKm] = useState('20');

  const list = useMemo(() => {
    const max = Number(radiusKm) || 0;
    return ecopoints
      .map((point) => ({ point, km: distanceKm(origin, point) }))
      .filter((item) => item.km <= max)
      .sort((a, b) => b.point.occupancy - a.point.occupancy);
  }, [origin, radiusKm]);

  const needing = list.filter((item) => item.point.occupancy >= COLLECTION_THRESHOLD).length;

  return (
    <AppScreen title="Estoque dos ecopontos" subtitle="Acompanhe a ocupação dos compartimentos">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <OriginFilter address={address} onAddressChange={setAddress} onSubmitAddress={searchAddress} onLocate={locateMe} locating={locating} radiusKm={radiusKm} onRadiusChange={setRadiusKm} error={error} />

        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Icon name="truck-outline" family="material" size={20} color={colors.primaryDark} />
          </View>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryStrong}>{needing}</Text> de {list.length} ecopontos precisam de coleta.
          </Text>
        </View>

        {list.map(({ point, km }) => {
          const needsCollection = point.occupancy >= COLLECTION_THRESHOLD;
          return (
            <View key={point.id} style={[shared.card, styles.card]}>
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <Icon name="location" size={19} color={colors.primary} />
                </View>
                <View style={styles.cardTitleBlock}>
                  <Text style={styles.cardTitle}>{point.name}</Text>
                  <Text style={styles.cardAddress}>{point.address}</Text>
                </View>
                {needsCollection && (
                  <View style={styles.flag}>
                    <Text style={styles.flagText}>Coleta necessária</Text>
                  </View>
                )}
              </View>
              <View style={styles.divider} />
              <View style={styles.cardBottom}>
                <View style={styles.meta}>
                  <Icon name="navigate" size={15} color={colors.accent} />
                  <Text style={styles.metaText}>{formatDistance(km)}</Text>
                </View>
                <View style={styles.capacity}>
                  <Text style={styles.capacityLabel}>{point.occupancy}% ocupado</Text>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { width: `${point.occupancy}%` }, needsCollection && styles.barFillWarning]} />
                  </View>
                </View>
              </View>
            </View>
          );
        })}
        {!list.length && <Text style={[shared.text, { textAlign: 'center' }]}>Nenhum ecoponto nesta distância.</Text>}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 36, gap: spacing.md },
  summary: { padding: 13, borderRadius: radius.md, backgroundColor: colors.lime, flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  summaryText: { color: colors.primaryDark, fontSize: 13, flex: 1 },
  summaryStrong: { fontWeight: '800' },
  card: { gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  cardTitleBlock: { flex: 1, gap: 3 },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  cardAddress: { color: colors.muted, fontSize: 12 },
  flag: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.warningSoft },
  flagText: { color: colors.warning, fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.line },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  capacity: { flex: 1, maxWidth: 170, gap: 5 },
  capacityLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#E6ECE7', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  barFillWarning: { backgroundColor: colors.warning },
});
