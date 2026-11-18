// Dados de exemplo. Quando houver backend, substitua por uma chamada à API.
export type WeekHours = { day: string; open: string; close: string }[];

export type EcoPoint = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  hours: WeekHours;
  /** Ocupação do compartimento de 0 a 100 (usado na tela de admin). */
  occupancy: number;
};

const weekdays: WeekHours = [
  { day: 'seg', open: '08:00', close: '18:00' },
  { day: 'ter', open: '08:00', close: '18:00' },
  { day: 'qua', open: '08:00', close: '18:00' },
  { day: 'qui', open: '08:00', close: '18:00' },
  { day: 'sex', open: '08:00', close: '18:00' },
];

const allDay: WeekHours = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((day) => ({ day, open: '00:00', close: '23:59' }));

export const ecopoints: EcoPoint[] = [
  // Ponto de teste na localização padrão do emulador Android, aberto 24h para testar o fluxo de descarte.
  { id: 'amphitheatre', name: 'Ecoponto Amphitheatre', address: 'Amphitheatre Parkway, 1600', latitude: 37.421998, longitude: -122.084, hours: allDay, occupancy: 25 },
  { id: 'vila-leopoldina', name: 'Ecoponto Vila Leopoldina', address: 'Rua do Ecoponto, 222', latitude: -23.5302, longitude: -46.7337, hours: weekdays, occupancy: 90 },
  { id: 'jaguare', name: 'Ecoponto Jaguaré', address: 'Av. Jaguaré, 818', latitude: -23.5487, longitude: -46.7489, hours: weekdays, occupancy: 50 },
  { id: 'lapa', name: 'Ecoponto Lapa', address: 'Rua Guaicurus, 1000', latitude: -23.5248, longitude: -46.7032, hours: [...weekdays, { day: 'sáb', open: '08:00', close: '12:00' }], occupancy: 25 },
  { id: 'pinheiros', name: 'Ecoponto Pinheiros', address: 'Rua dos Pinheiros, 1200', latitude: -23.5662, longitude: -46.6905, hours: weekdays, occupancy: 100 },
  { id: 'butanta', name: 'Ecoponto Butantã', address: 'Av. Vital Brasil, 500', latitude: -23.5718, longitude: -46.7202, hours: weekdays, occupancy: 75 },
];

/** Endereço padrão do Figma, usado quando a localização não está disponível. */
export const defaultOrigin = { label: 'Rua Irineu José Bordon, 375', latitude: -23.5568, longitude: -46.7441 };

const dayKeys = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function isOpenNow(point: EcoPoint, now = new Date()) {
  const today = point.hours.find((h) => h.day === dayKeys[now.getDay()]);
  if (!today) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  return minutes >= toMin(today.open) && minutes < toMin(today.close);
}

const dayNames: Record<string, string> = { dom: 'Domingo', seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sáb: 'Sábado' };
const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const formatTime = (t: string) => (t.slice(3) === '00' ? `${t.slice(0, 2)}h` : `${t.slice(0, 2)}h${t.slice(3)}`);

/**
 * Horário da semana em linhas, juntando dias seguidos com o mesmo horário.
 * Ex.: ["Segunda a Sexta: 08h às 18h", "Sábado: 08h às 12h", "Domingo: fechado"]
 */
export function formatWeekHours(point: EcoPoint) {
  // Segunda primeiro, domingo por último (como o brasileiro costuma ler).
  const order = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  const slot = (day: string) => {
    const h = point.hours.find((x) => x.day === day);
    return h ? `${formatTime(h.open)} às ${formatTime(h.close)}` : 'fechado';
  };
  const lines: string[] = [];
  let start = 0;
  for (let i = 1; i <= order.length; i++) {
    if (i === order.length || slot(order[i]) !== slot(order[start])) {
      const span = i - start;
      const days = span === 1 ? dayNames[order[start]] : `${dayNames[order[start]]} ${span === 2 ? 'e' : 'a'} ${dayNames[order[i - 1]]}`;
      lines.push(`${days}: ${slot(order[start])}`);
      start = i;
    }
  }
  return lines;
}

/** Próxima abertura a partir de agora. Ex.: "hoje às 08h", "amanhã às 08h", "segunda às 08h". */
export function nextOpening(point: EcoPoint, now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  for (let offset = 0; offset < 8; offset++) {
    const dayIndex = (now.getDay() + offset) % 7;
    const h = point.hours.find((x) => x.day === dayKeys[dayIndex]);
    if (!h || (offset === 0 && minutes >= toMinutes(h.open))) continue;
    const when = offset === 0 ? 'hoje' : offset === 1 ? 'amanhã' : dayNames[dayKeys[dayIndex]].toLowerCase();
    return `${when} às ${formatTime(h.open)}`;
  }
  return null;
}

/** Texto do aviso de ecoponto fechado, com a próxima abertura e o horário da semana. */
export function closedMessage(point: EcoPoint) {
  const next = nextOpening(point);
  return `O ${point.name} está fechado agora${next ? ` e abre ${next}` : ''}. Volte no horário de funcionamento para descartar.\n\n${formatWeekHours(point).join('\n')}`;
}

/** Distância em km entre duas coordenadas (fórmula de Haversine). */
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} M` : `${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} KM`;
}

/**
 * Formato esperado do QR code colado no dispositivo de coleta:
 *   reloop://ecoponto/<id-do-ecoponto>/<id-do-dispositivo>
 */
export function parseDeviceQr(data: string) {
  const match = /^reloop:\/\/ecoponto\/([\w-]+)\/([\w-]+)$/i.exec(data.trim());
  if (!match) return null;
  const point = ecopoints.find((p) => p.id === match[1].toLowerCase());
  if (!point) return null;
  return { point, deviceId: match[2] };
}
