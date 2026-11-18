import { Tabs } from 'expo-router';
import { Image, ImageSourcePropType } from 'react-native';
import { useSession } from '../../session';
import { colors } from '../../theme';

const icons = {
  map: { on: require('../../../assets/icons/map-active.png'), off: require('../../../assets/icons/map.png'), w: 30, h: 30 },
  basket: { on: require('../../../assets/icons/basket-active.png'), off: require('../../../assets/icons/basket.png'), w: 33, h: 28 },
  van: { on: require('../../../assets/icons/van-active.png'), off: require('../../../assets/icons/van.png'), w: 36, h: 23 },
};

function tabIcon(name: keyof typeof icons) {
  const icon = icons[name];
  return function TabIcon({ focused }: { focused: boolean }) {
    return <Image source={(focused ? icon.on : icon.off) as ImageSourcePropType} style={{ width: icon.w, height: icon.h }} resizeMode="contain" />;
  };
}

const hiddenTab = { tabBarItemStyle: { display: 'none' as const } };

export default function TabLayout() {
  const { isAdmin } = useSession();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { height: 76, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.primary, backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Mapa', tabBarIcon: tabIcon('map') }} />
      <Tabs.Screen name="rewards" options={{ title: 'Benefícios', tabBarIcon: tabIcon('basket') }} />
      {/* Aba de estoque: só existe para administradores. Para os demais, a rota fica bloqueada. */}
      {/* Aba de estoque: só existe para administradores. Para os demais, a rota fica bloqueada. */}
      <Tabs.Protected guard={isAdmin}>
        <Tabs.Screen name="stock" options={{ title: 'Estoque', tabBarIcon: tabIcon('van') }} />
      </Tabs.Protected>
      {/* Fluxo de descarte e conta: sem botão na barra, mas navegáveis e com a barra visível (como no Figma).
          Não use `href: null` aqui: nesta versão do expo-router isso bloqueia a navegação para a tela. */}
      <Tabs.Screen name="scan" options={hiddenTab} />
      <Tabs.Screen name="discard" options={hiddenTab} />
      <Tabs.Screen name="validated" options={hiddenTab} />
      <Tabs.Screen name="weighed" options={hiddenTab} />
      <Tabs.Screen name="account" options={hiddenTab} />
    </Tabs>
  );
}
