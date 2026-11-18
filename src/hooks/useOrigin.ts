import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { defaultOrigin } from '../data/ecopoints';

export type Origin = { label: string; latitude: number; longitude: number };

type LocateResult = { origin: Origin } | { error: string };

/** Lê a posição do GPS (pedindo permissão) e tenta transformar em endereço. */
async function readDeviceLocation(): Promise<LocateResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { error: 'Permissão de localização negada. Digite um endereço.' };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    let label = 'Minha localização';
    try {
      const [place] = await Location.reverseGeocodeAsync(coords);
      if (place) label = [place.street, place.streetNumber].filter(Boolean).join(', ') || place.name || label;
    } catch {
      // Sem geocodificação reversa: mantém o rótulo genérico.
    }
    return { origin: { label, ...coords } };
  } catch {
    return { error: 'Não foi possível obter sua localização.' };
  }
}

/**
 * Ponto de partida para calcular distâncias: começa com a localização real do aparelho
 * (se o usuário permitir) e pode ser trocado digitando um endereço.
 */
export function useOrigin() {
  const [origin, setOrigin] = useState<Origin>(defaultOrigin);
  const [address, setAddress] = useState(defaultOrigin.label);
  const [locating, setLocating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((result: LocateResult) => {
    if ('origin' in result) {
      setOrigin(result.origin);
      setAddress(result.origin.label);
      setError(null);
    } else {
      setError(result.error);
    }
    setLocating(false);
  }, []);

  const locateMe = useCallback(() => {
    setLocating(true);
    readDeviceLocation().then(apply);
  }, [apply]);

  const searchAddress = useCallback(async () => {
    const query = address.trim();
    if (!query) return;
    setLocating(true);
    try {
      const [result] = await Location.geocodeAsync(`${query}, São Paulo`);
      apply(result ? { origin: { label: query, latitude: result.latitude, longitude: result.longitude } } : { error: 'Endereço não encontrado.' });
    } catch {
      apply({ error: 'Não foi possível buscar este endereço.' });
    }
  }, [address, apply]);

  // Ao abrir a tela, tenta usar a localização real.
  useEffect(() => {
    let active = true;
    readDeviceLocation().then((result) => active && apply(result));
    return () => {
      active = false;
    };
  }, [apply]);

  return { origin, address, setAddress, searchAddress, locateMe, locating, error };
}
