import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { OsmMap, OsmMapHandle } from '../../components/OsmMap';
import { BUTTON_HEIGHT, BUTTON_RADIUS, EcoPointCard, useDialog, Icon, LegacyButton, legacyColors as colors, LegacyHeader, legacyRadius as radius, legacySpacing as spacing } from '../../components/legacy';
import { closedMessage, distanceKm, EcoPoint, ecopoints, formatWeekHours, isOpenNow } from '../../data/ecopoints';
import { useOrigin } from '../../hooks/useOrigin';

type Filter = 'Todos' | 'Abertos' | 'Mais próximos';
const NEARBY_KM = 5;
const dayKeys = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function todayHours(point: EcoPoint, open: boolean) {
  const today = point.hours.find((h) => h.day === dayKeys[new Date().getDay()]);
  if (!today) return 'Fechado hoje';
  const fmt = (t: string) => `${t.slice(0, 2)}h${t.slice(3) === '00' ? '' : t.slice(3)}`;
  return open ? `${fmt(today.open)} às ${fmt(today.close)}` : `Abre às ${fmt(today.open)}`;
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} km`;
}

export default function EcopontosScreen() {
  const router = useRouter();
  const { origin, locateMe, locating, error } = useOrigin();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Todos');
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ point: EcoPoint; km: number; open: boolean } | null>(null);
  const mapRef = useRef<OsmMapHandle>(null);
  const dialog = useDialog();

  const points = useMemo(
    () =>
      ecopoints
        .map((point) => {
          const km = distanceKm(origin, point);
          const open = isOpenNow(point);
          return { point, km, open };
        })
        .sort((a, b) => a.km - b.km),
    [origin],
  );

  const filteredPoints = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return points.filter(({ point, km, open }) => {
      const matchesQuery = !normalized || `${point.name} ${point.address}`.toLowerCase().includes(normalized);
      const matchesFilter = filter === 'Todos' || (filter === 'Abertos' ? open : km <= NEARBY_KM);
      return matchesQuery && matchesFilter;
    });
  }, [points, filter, query]);

  const mapPoints = useMemo(() => filteredPoints.map(({ point }) => ({ id: point.id, latitude: point.latitude, longitude: point.longitude, title: point.name })), [filteredPoints]);

  // Enquadra a origem e os ecopontos mais próximos (até 5), para o mapa não abrir longe demais.
  useEffect(() => {
    mapRef.current?.fitTo([origin, ...filteredPoints.slice(0, 5).map((p) => p.point)]);
  }, [origin, filteredPoints, expanded]);

  function focus(point: EcoPoint) {
    setSelected(point.id);
    mapRef.current?.focus(point);
  }

  function openRoute(point: EcoPoint) {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${point.latitude},${point.longitude}`;
    Linking.openURL(url).catch(() => dialog({ title: 'Não foi possível abrir o mapa', tone: 'danger', icon: 'map-outline' }));
  }

  return (
    <View style={styles.screen}>
      <LegacyHeader title="Encontre um ecoponto" subtitle="Descarte com consciência perto de você" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.muted} />
          <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Buscar por endereço ou bairro" placeholderTextColor={colors.muted} returnKeyType="search" />
          <Pressable accessibilityLabel="Usar minha localização" style={styles.locationButton} onPress={locateMe}>
            {locating ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="locate-outline" size={19} color={colors.primary} />}
          </Pressable>
        </View>

        <View style={styles.originRow}>
          <Ionicons name="navigate-outline" size={16} color={colors.primary} />
          <Text style={styles.originText} numberOfLines={1}>
            {error ?? origin.label}
          </Text>
          <Text style={styles.originDistance}>{filteredPoints[0] ? formatDistance(filteredPoints[0].km) : '—'}</Text>
        </View>

        <View style={[styles.mapPreview, expanded && styles.mapExpanded]}>
          <OsmMap
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            origin={origin}
            points={mapPoints}
            selectedId={selected}
            onMarkerPress={(id) => {
              // Tocar num marcador abre o mesmo painel do card.
              const item = points.find((p) => p.point.id === id);
              if (item) {
                setSelected(id);
                setSheet(item);
              }
            }}
          />
          <View style={styles.mapLegend} pointerEvents="none">
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>ecopontos próximos</Text>
          </View>
          <Pressable style={styles.mapButton} onPress={() => setExpanded((v) => !v)}>
            <Ionicons name={expanded ? 'contract-outline' : 'expand-outline'} size={16} color={colors.primary} />
            <Text style={styles.mapButtonText}>{expanded ? 'Reduzir mapa' : 'Abrir mapa'}</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Ecopontos na sua região</Text>
            <Text style={styles.sectionSubtitle}>{filteredPoints.length} opções encontradas</Text>
          </View>
        </View>

        <View style={styles.chipsRow}>
          {(['Todos', 'Abertos', 'Mais próximos'] as const).map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filterChip, filter === item && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.cardsList}>
          {filteredPoints.map(({ point, km, open }) => (
            <EcoPointCard
              key={point.id}
              selected={selected === point.id}
              point={{ name: point.name, address: point.address, distance: formatDistance(km), status: open ? 'Aberto' : 'Fechado', hours: todayHours(point, open), occupancy: point.occupancy }}
              onPress={() => {
                focus(point);
                setSheet({ point, km, open });
              }}
            />
          ))}
          {!filteredPoints.length && <Text style={styles.noResults}>Nenhum ecoponto encontrado para esta busca.</Text>}
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Icon name="leaf" family="material" size={19} color={colors.primaryDark} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Dica rápida</Text>
            <Text style={styles.tipText}>Separe os materiais antes de sair. Isso agiliza a pesagem e aumenta a precisão dos seus pontos.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Painel com as ações do ecoponto tocado. */}
      <Modal visible={!!sheet} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheet(null)}>
          {sheet && (
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <View style={styles.sheetIcon}>
                  <Icon name="location" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>{sheet.point.name}</Text>
                  <Text style={styles.sheetAddress}>{sheet.point.address}</Text>
                </View>
              </View>
              <View style={styles.sheetMeta}>
                <View style={styles.sheetMetaItem}>
                  <Icon name="navigate" size={15} color={colors.accent} />
                  <Text style={styles.sheetMetaText}>{formatDistance(sheet.km)} de você</Text>
                </View>
                <View style={styles.sheetMetaItem}>
                  <Icon name="time-outline" size={15} color={sheet.open ? colors.accent : colors.muted} />
                  <Text style={[styles.sheetMetaText, !sheet.open && styles.sheetClosed]}>{sheet.open ? `Aberto · ${todayHours(sheet.point, true)}` : `Fechado · ${todayHours(sheet.point, false)}`}</Text>
                </View>
                <View style={styles.sheetHours}>
                  {formatWeekHours(sheet.point).map((line) => (
                    <Text key={line} style={styles.sheetHoursText}>
                      {line}
                    </Text>
                  ))}
                </View>
              </View>
              <LegacyButton
                style={!sheet.open && styles.sheetButtonClosed}
                icon={sheet.open ? undefined : 'time-outline'}
                onPress={() => {
                  const target = sheet;
                  setSheet(null);
                  // Fechado: não abre o leitor de QR, só avisa o horário.
                  if (!target.open) {
                    dialog({ title: 'Ecoponto fechado', message: closedMessage(target.point), icon: 'time-outline', tone: 'danger' });
                    return;
                  }
                  router.push('/scan');
                }}
              >
                {sheet.open ? 'Descartar aqui' : 'Fechado agora'}
              </LegacyButton>
              <Pressable
                style={({ pressed }) => [styles.sheetSecondary, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  const target = sheet.point;
                  setSheet(null);
                  openRoute(target);
                }}
              >
                <Icon name="map-outline" size={18} color={colors.primary} />
                <Text style={styles.sheetSecondaryText}>Ver rota no Google Maps</Text>
              </Pressable>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: 36, gap: spacing.md },
  searchBox: { height: 50, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 0 },
  locationButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  originRow: { minHeight: 39, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  originText: { flex: 1, color: colors.muted, fontSize: 12 },
  originDistance: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  mapPreview: { height: 156, overflow: 'hidden', borderRadius: radius.md, backgroundColor: '#DCEBDC', borderWidth: 1, borderColor: '#C9DDCB' },
  mapExpanded: { height: 380 },
  mapLegend: { position: 'absolute', bottom: 10, left: 12, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.9)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  legendText: { color: colors.primaryDark, fontSize: 10, fontWeight: '700' },
  mapButton: { position: 'absolute', top: 10, right: 10, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 5 },
  mapButtonText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 5 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: colors.surface },
  cardsList: { gap: 11 },
  noResults: { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: spacing.lg },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.paper, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, paddingBottom: 36, gap: spacing.md },
  sheetHandle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: colors.line, marginTop: -8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  sheetAddress: { color: colors.muted, fontSize: 13, marginTop: 2 },
  sheetMeta: { borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 13, gap: 9 },
  sheetMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetMetaText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  sheetClosed: { color: colors.muted },
  sheetHours: { marginTop: 2, paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.line, gap: 3 },
  sheetHoursText: { color: colors.muted, fontSize: 12 },
  sheetButtonClosed: { backgroundColor: colors.muted },
  sheetSecondary: { minHeight: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sheetSecondaryText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  tipCard: { padding: 13, borderRadius: radius.md, backgroundColor: colors.lime, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tipIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  tipContent: { flex: 1, gap: 3 },
  tipTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  tipText: { color: colors.primaryDark, fontSize: 12, lineHeight: 17 },
});
