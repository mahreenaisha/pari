import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/navigation/tab-bar';
import { Icon } from '@/components/ui/icon';
import { colors } from '@/theme';

export default function TabsLayout() {
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
          title: 'Listen',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'listenFilled' : 'listen'} size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: 'QR',
          tabBarIcon: ({ color, size }) => <Icon name="qr" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: 'Ledger',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'ledgerFilled' : 'ledger'} size={size} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
