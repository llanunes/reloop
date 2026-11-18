import { BarcodeScanningResult, CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useIsFocused, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen, Icon, useDialog, LegacyButton, legacyColors as colors, legacyRadius as radius, legacySpacing as spacing, SecondaryButton, shared } from '../../components/legacy';
import { closedMessage, distanceKm, formatKm, isOpenNow, parseDeviceQr } from '../../data/ecopoints';
import { useSession } from '../../session';

/** Distância máxima entre o usuário e o ecoponto para liberar o descarte. */
const MAX_DISTANCE_KM = 0.3;

export default function ScanScreen() {
  const router = useRouter();
  const focused = useIsFocused();
  const { startDisposal } = useSession();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const handling = useRef(false);
  const dialog = useDialog();

  async function handleData(data: string) {
    if (handling.current) return;
    handling.current = true;
    setBusy(true);
    const release = () => {
      handling.current = false;
      setBusy(false);
    };

    const parsed = parseDeviceQr(data);
    if (!parsed) {
      dialog({ title: 'QR code inválido', message: 'Este QR code não pertence a um dispositivo de coleta ReLoop.', icon: 'qr-code-outline', tone: 'danger', buttons: [{ text: 'Tentar de novo', onPress: release }] });
      return;
    }

    // Ecoponto fechado: não libera o descarte.
    if (!isOpenNow(parsed.point)) {
      dialog({ title: 'Ecoponto fechado', message: closedMessage(parsed.point), icon: 'time-outline', tone: 'danger', buttons: [{ text: 'Entendi', onPress: release }] });
      return;
    }

    // Valida se o usuário está perto do ecoponto do QR code.
    let km: number | null = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        km = distanceKm(pos.coords, parsed.point);
      }
    } catch {
      km = null;
    }

    const proceed = () => {
      startDisposal(parsed.point, parsed.deviceId);
      release();
      router.push('/discard');
    };

    if (km !== null && km <= MAX_DISTANCE_KM) {
      proceed();
      return;
    }

    const reason = km === null ? 'Não conseguimos confirmar sua localização.' : `Você está a ${formatKm(km).toLowerCase()} do ${parsed.point.name}.`;
    // Em desenvolvimento (emulador) permitimos seguir, já que o GPS do emulador não fica em São Paulo.
    dialog({
      title: 'Localização não validada',
      message: `${reason} Vá até o ecoponto para descartar.`,
      icon: 'location-outline',
      tone: 'danger',
      buttons: __DEV__
        ? [
            { text: 'Continuar (modo dev)', onPress: proceed },
            { text: 'Cancelar', style: 'cancel', onPress: release },
          ]
        : [{ text: 'Entendi', onPress: release }],
    });
  }

  function onScanned(result: BarcodeScanningResult) {
    handleData(result.data);
  }

  async function scanFromGallery() {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (picked.canceled) return;
    try {
      const [found] = await scanFromURLAsync(picked.assets[0].uri, ['qr']);
      if (!found) {
        dialog({ title: 'Nenhum QR code encontrado', message: 'Escolha uma imagem em que o QR code esteja nítido.', icon: 'qr-code-outline', tone: 'danger' });
        return;
      }
      handleData(found.data);
    } catch {
      dialog({ title: 'Não foi possível ler a imagem', message: 'Tente escolher outra foto.', tone: 'danger' });
    }
  }

  return (
    <AppScreen
      title="Descartar materiais"
      subtitle="Escaneie o QR code do dispositivo de coleta"
      footer={
        <>
          {permission && !permission.granted && (
            <LegacyButton onPress={requestPermission} icon="camera-outline">
              Permitir câmera
            </LegacyButton>
          )}
          <SecondaryButton onPress={scanFromGallery} icon="image-outline">
            Ler de uma imagem da galeria
          </SecondaryButton>
        </>
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[shared.card, styles.scanCard]}>
          <Text style={[shared.title, styles.center]}>Aponte a câmera para o QR code</Text>
          <Text style={[shared.text, styles.center]}>Após validarmos sua localização, você poderá preencher o formulário dos itens a serem descartados.</Text>

          <View style={styles.frame}>
            {permission?.granted && focused ? (
              <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={busy ? undefined : onScanned} />
            ) : (
              <View style={styles.permission}>
                <Icon name="qrcode-scan" family="material" size={58} color={colors.primary} />
                {permission && !permission.granted && <Text style={[shared.text, styles.center]}>Precisamos da câmera para ler o QR code.</Text>}
              </View>
            )}
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            {busy && (
              <View style={styles.busy}>
                <ActivityIndicator size="large" color={colors.surface} />
                <Text style={styles.busyText}>Validando localização…</Text>
              </View>
            )}
          </View>

        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Icon name="information-circle-outline" size={20} color={colors.primary} />
          </View>
          <Text style={styles.infoText}>O QR code fica colado no dispositivo de coleta do ecoponto. Você precisa estar no local para descartar.</Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const CORNER = 34;
const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 36, gap: spacing.md },
  scanCard: { alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  center: { textAlign: 'center' },
  frame: { width: 250, height: 250, borderRadius: radius.md, backgroundColor: '#F4F7F3', overflow: 'hidden' },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 12 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.primary },
  tl: { top: 14, left: 14, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  tr: { top: 14, right: 14, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bl: { bottom: 14, left: 14, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  br: { bottom: 14, right: 14, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  busy: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  busyText: { color: colors.surface, fontSize: 13, fontWeight: '700' },
  infoCard: { borderRadius: radius.md, backgroundColor: colors.mint, padding: 13, flexDirection: 'row', gap: 9, alignItems: 'center' },
  infoIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  infoText: { color: colors.primaryDark, fontSize: 12, lineHeight: 17, flex: 1 },
});
