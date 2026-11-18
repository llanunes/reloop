// Mapa gratuito: OpenStreetMap desenhado com Leaflet dentro de uma WebView.
// Não precisa de chave de API nem de conta no Google (o react-native-maps exige chave do Google no Android).
import { ComponentType, forwardRef, Ref, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewProps } from 'react-native-webview';

// Os tipos da react-native-webview 14 declaram WebView<P = undefined>, o que faz as props virarem `never`.
// Tipamos só o que usamos: as props normais e o método injectJavaScript do ref.
type WebViewHandle = { injectJavaScript: (script: string) => void };
const Web = WebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebViewHandle> }>;

export type MapPoint = { id: string; latitude: number; longitude: number; title: string; subtitle?: string };
export type OsmMapHandle = {
  /** Enquadra todos os pontos informados. */
  fitTo: (coords: { latitude: number; longitude: number }[]) => void;
  /** Aproxima o mapa num ponto. */
  focus: (coord: { latitude: number; longitude: number }) => void;
};

type Props = {
  origin: { latitude: number; longitude: number; label: string };
  points: MapPoint[];
  selectedId?: string | null;
  onMarkerPress?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};

const html = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;height:100%;background:#DCEBDC}
  .pin{width:26px;height:26px;border-radius:50%;background:#45C675;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);box-sizing:border-box}
  .pin.sel{background:#2F6B40;transform:scale(1.25)}
  .me{width:18px;height:18px;border-radius:50%;background:#1D4D2D;border:3px solid #fff;box-shadow:0 0 0 6px rgba(29,77,45,.2);box-sizing:border-box}
  .leaflet-control-attribution{font-size:9px}
</style></head><body><div id="map"></div><script>
  var map = L.map('map', { zoomControl: false }).setView([-23.55, -46.73], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  function send(msg){ window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  window.render = function(data){
    layer.clearLayers();
    L.marker([data.origin.latitude, data.origin.longitude], { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [18,18] }) })
      .bindTooltip('Você está aqui').addTo(layer);
    data.points.forEach(function(p){
      var icon = L.divIcon({ className: '', html: '<div class="pin' + (p.id === data.selectedId ? ' sel' : '') + '"></div>', iconSize: [26,26] });
      L.marker([p.latitude, p.longitude], { icon: icon }).on('click', function(){ send({ type: 'marker', id: p.id }); }).addTo(layer);
    });
  };
  window.fitTo = function(coords){
    if (!coords.length) return;
    if (coords.length === 1) { map.setView([coords[0].latitude, coords[0].longitude], 15); return; }
    map.fitBounds(coords.map(function(c){ return [c.latitude, c.longitude]; }), { padding: [30,30], maxZoom: 15 });
  };
  window.focusOn = function(c){ map.flyTo([c.latitude, c.longitude], 16, { duration: 0.5 }); };
  send({ type: 'ready' });
</script></body></html>`;

export const OsmMap = forwardRef<OsmMapHandle, Props>(function OsmMap({ origin, points, selectedId, onMarkerPress, style }, ref) {
  const webRef = useRef<WebViewHandle>(null);
  const ready = useRef(false);
  const pending = useRef<string[]>([]);

  // Comandos enviados antes do mapa carregar ficam na fila até o "ready".
  const run = useCallback((js: string) => {
    if (ready.current) webRef.current?.injectJavaScript(`${js};true;`);
    else pending.current.push(js);
  }, []);

  useImperativeHandle(ref, () => ({
    fitTo: (coords) => run(`window.fitTo(${JSON.stringify(coords)})`),
    focus: (coord) => run(`window.focusOn(${JSON.stringify(coord)})`),
  }), [run]);

  useEffect(() => {
    run(`window.render(${JSON.stringify({ origin, points, selectedId: selectedId ?? null })})`);
  }, [origin, points, selectedId, run]);

  function onMessage(event: WebViewMessageEvent) {
    let msg: { type: string; id?: string };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      ready.current = true;
      const queued = pending.current;
      pending.current = [];
      queued.forEach((js) => webRef.current?.injectJavaScript(`${js};true;`));
    } else if (msg.type === 'marker' && msg.id) {
      onMarkerPress?.(msg.id);
    }
  }

  return <Web ref={webRef} source={{ html }} originWhitelist={['*']} onMessage={onMessage} style={style} scrollEnabled={false} javaScriptEnabled />;
});
