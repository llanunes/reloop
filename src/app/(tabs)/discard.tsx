import * as ImagePicker from 'expo-image-picker';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen, ErrorText, useDialog, Field, Icon, LegacyButton, legacyColors as colors, legacyRadius as radius, legacySpacing as spacing, Select, shared } from '../../components/legacy';
import { itemTypes } from '../../data/items';
import { validatePhoto } from '../../services/photoValidation';
import { useSession } from '../../session';

export default function DiscardScreen() {
  const { disposal } = useSession();
  if (!disposal) return <Redirect href="/scan" />;
  // A key faz o formulário começar do zero a cada novo QR code lido.
  return <DiscardForm key={disposal.id} />;
}

function DiscardForm() {
  const router = useRouter();
  const { disposal, updateDisposal } = useSession();
  const dialog = useDialog();
  const [typeName, setTypeName] = useState(itemTypes[0].name);
  const type = itemTypes.find((t) => t.name === typeName) ?? itemTypes[0];
  const [modelName, setModelName] = useState(type.models[0].name);
  const model = type.models.find((m) => m.name === modelName) ?? type.models[0];
  const [quantity, setQuantity] = useState('6');
  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const photoUri = photo?.uri ?? null;
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  if (!disposal) return null;

  // Troca de tipo: volta para o primeiro modelo daquele tipo.
  function changeType(name: string) {
    setTypeName(name);
    setModelName(itemTypes.find((t) => t.name === name)?.models[0].name ?? '');
  }

  const qty = Number(quantity) || 0;
  const points = qty * model.pointsPerUnit;

  async function pick(source: 'camera' | 'library') {
    const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      dialog({
        title: 'Permissão necessária',
        message: source === 'camera' ? 'Libere o acesso à câmera para tirar a foto.' : 'Libere o acesso às fotos para escolher uma imagem.',
        icon: source === 'camera' ? 'camera-outline' : 'images-outline',
        tone: 'danger',
      });
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) {
      setPhoto({ uri: result.assets[0].uri });
      setError(null);
    }
  }

  function choosePhoto() {
    dialog({
      title: 'Foto dos itens',
      message: 'A foto deve mostrar todos os itens fora das embalagens.',
      icon: 'camera-outline',
      buttons: [
        { text: 'Tirar foto', icon: 'camera-outline', onPress: () => pick('camera') },
        { text: 'Escolher da galeria', icon: 'images-outline', onPress: () => pick('library') },
        { text: 'Cancelar', style: 'cancel' },
      ],
    });
  }

  function proceed(uri: string) {
    updateDisposal({ itemName: type.name, model: model.name, quantity: qty, points, photoUri: uri });
    router.replace('/validated');
  }

  async function submit() {
    if (qty < 1) return setError('Informe a quantidade de itens.');
    if (!photo) return setError('Envie a foto dos itens selecionados.');
    setError(null);
    setValidating(true);
    try {
      // A IA do próprio celular (ML Kit) confere se a foto mostra o tipo de item declarado.
      const result = await validatePhoto({ uri: photo.uri, itemName: type.name });
      if (result.approved) {
        proceed(photo.uri);
        return;
      }
      dialog({
        title: 'A foto não confere',
        // Em desenvolvimento mostramos o que o ML Kit reconheceu, para ajustar as regras.
        message: __DEV__ && result.labels.length ? `${result.reason}\n\nReconhecido: ${result.labels.map((l) => `${l.text} (${Math.round(l.confidence * 100)}%)`).join(', ')}` : result.reason,
        icon: 'image-outline',
        tone: 'danger',
        buttons: [
          { text: 'Trocar foto', icon: 'camera-outline', onPress: choosePhoto },
          { text: 'Corrigir formulário', style: 'cancel' },
        ],
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Não foi possível validar a foto.';
      dialog({
        title: 'Não deu para validar a foto',
        message,
        tone: 'danger',
        // Em desenvolvimento dá para seguir sem a IA (por exemplo, rodando no Expo Go, sem o módulo nativo).
        buttons: __DEV__
          ? [
              { text: 'Continuar sem validar (modo dev)', onPress: () => proceed(photo.uri) },
              { text: 'Cancelar', style: 'cancel' },
            ]
          : [{ text: 'Tentar de novo', onPress: submit }, { text: 'Cancelar', style: 'cancel' }],
      });
    } finally {
      setValidating(false);
    }
  }

  return (
    <AppScreen
      title="Itens do descarte"
      subtitle={`${disposal.point.name} · dispositivo ${disposal.deviceId}`}
      footer={
        <>
          <ErrorText>{error}</ErrorText>
          <LegacyButton onPress={submit} icon="arrow-forward" loading={validating}>
            Enviar para validação
          </LegacyButton>
          {validating && <Text style={styles.validatingText}>A IA está conferindo sua foto…</Text>}
        </>
      }
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Icon name="camera-outline" size={19} color={colors.primaryDark} />
            </View>
            <Text style={styles.infoText}>No final, envie uma foto com todos os itens fora das embalagens.</Text>
          </View>

          <View style={[shared.card, styles.formCard]}>
            <Text style={shared.title}>O que você vai descartar?</Text>
            <Select label="Nome" value={type.name} options={itemTypes.map((t) => t.name)} onChange={changeType} />
            <Select label="Modelo" value={model.name} options={type.models.map((m) => m.name)} onChange={setModelName} />
            <View style={styles.row}>
              <View style={styles.half}>
                <Field label="Peso" value={model.weight} editable={false} />
              </View>
              <View style={styles.half}>
                <Field label="Quantidade" value={quantity} onChangeText={(v) => setQuantity(v.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" />
              </View>
            </View>
            <View style={styles.pointsPreview}>
              <Text style={styles.pointsLabel}>Pontos estimados</Text>
              <View style={styles.pointsValue}>
                <Icon name="leaf" family="material" size={18} color={colors.primary} />
                <Text style={styles.pointsNumber}>{points.toLocaleString('pt-BR')} pts</Text>
              </View>
            </View>
          </View>

          <View style={[shared.card, styles.photoCard]}>
            <Text style={shared.title}>Foto dos itens</Text>
            {photoUri ? (
              <Pressable onPress={choosePhoto} style={styles.preview}>
                <Image source={{ uri: photoUri }} style={styles.previewImage} />
                <View style={styles.previewBadge}>
                  <Icon name="sync" size={14} color={colors.surface} />
                  <Text style={styles.previewBadgeText}>Trocar foto</Text>
                </View>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" onPress={choosePhoto} style={({ pressed }) => [styles.uploadBox, pressed && { opacity: 0.8 }]}>
                <View style={styles.uploadIcon}>
                  <Icon name="image-outline" size={26} color={colors.primary} />
                </View>
                <Text style={styles.uploadTitle}>Adicionar foto</Text>
                <Text style={shared.text}>Tire uma foto ou escolha da galeria</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  validatingText: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  infoCard: { borderRadius: radius.md, backgroundColor: colors.mint, padding: 13, flexDirection: 'row', gap: 10, alignItems: 'center' },
  infoIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  infoText: { color: colors.primaryDark, fontSize: 12, lineHeight: 17, flex: 1 },
  formCard: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  pointsPreview: { padding: 13, borderRadius: radius.sm, backgroundColor: colors.lime, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointsLabel: { color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
  pointsValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pointsNumber: { color: colors.primaryDark, fontSize: 17, fontWeight: '800' },
  photoCard: { gap: 12 },
  uploadBox: { alignItems: 'center', gap: 6, paddingVertical: 22, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.accent, backgroundColor: '#F5FBF6' },
  uploadIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  uploadTitle: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  preview: { borderRadius: radius.md, overflow: 'hidden' },
  previewImage: { width: '100%', height: 210 },
  previewBadge: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: 'rgba(29,77,45,0.85)' },
  previewBadgeText: { color: colors.surface, fontSize: 12, fontWeight: '800' },
});
