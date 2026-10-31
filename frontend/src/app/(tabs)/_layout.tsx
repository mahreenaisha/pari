import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/navigation/tab-bar';
import { Icon } from '@/components/ui/icon';
import { usePariEvents } from '@/features/listening/use-pari-events';
import { useProfile } from '@/features/qr/use-profile';
import { useQrPayments } from '@/features/qr/use-qr-payments';
import { useStrings } from '@/i18n/use-strings';
import { colors } from '@/theme';

export default function TabsLayout() {
  usePariEvents();
  const strings = useStrings();
  const toMatch = useQrPayments().data?.length ?? 0;
  const language = useProfile().data?.language;

  if (language === null) return <Redirect href="/language" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: strings.tabs.listen,
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'listenFilled' : 'listen'} size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: strings.tabs.qr,
          tabBarBadge: toMatch > 0 ? toMatch : undefined,
          tabBarAccessibilityLabel: toMatch > 0 ? strings.tabs.qrToMatch(toMatch) : strings.tabs.qr,
          tabBarIcon: ({ color, size }) => <Icon name="qr" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: strings.tabs.ledger,
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'ledgerFilled' : 'ledger'} size={size} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
