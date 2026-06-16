// app/(tabs)/_layout.tsx
import { Tabs, router } from 'expo-router';
import { Text, View, TouchableOpacity } from 'react-native';
import { useStore } from '@/store';
import { getTheme } from '@/theme';
import { getTrialDaysLeft } from '@/lib/subscription';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  const dark           = useStore((s) => s.dark);
  const T              = getTheme(dark);
  const isPremium      = useStore((s) => s.isPremium);
  const trialStartDate = useStore((s) => s.trialStartDate);
  const daysLeft       = getTrialDaysLeft(trialStartDate);
  const trialExpired   = daysLeft === 0 && !isPremium;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Trial banner — shows when ≤5 days left or expired */}
      {!isPremium && daysLeft <= 5 && (
        <TouchableOpacity
          onPress={() => router.push('/(auth)/paywall')}
          style={{
            backgroundColor: trialExpired ? '#D85A30' : '#BA7517',
            paddingVertical: 9, paddingHorizontal: 16,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 }}>
            {trialExpired
              ? '⚠️ Free trial ended — subscribe to continue'
              : `⏳ ${daysLeft} day${daysLeft===1?'':'s'} left in your free trial`}
          </Text>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
            ₹99 →
          </Text>
        </TouchableOpacity>
      )}

      <Tabs screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: T.navBg,
          borderTopColor:  T.border,
          height: 72,
          paddingBottom: 12,
        },
        tabBarActiveTintColor:   '#7F77DD',
        tabBarInactiveTintColor: T.textSec,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700', marginTop: 2 },
      }}>
        <Tabs.Screen name="home"     options={{ title:'Home',    tabBarIcon: ({focused}) => <TabIcon emoji="🏠" focused={focused}/> }}/>
        <Tabs.Screen name="focus"    options={{ title:'Focus',   tabBarIcon: ({focused}) => <TabIcon emoji="🎯" focused={focused}/> }}/>
        <Tabs.Screen name="reflect"  options={{ title:'Reflect', tabBarIcon: ({focused}) => <TabIcon emoji="📓" focused={focused}/> }}/>
        <Tabs.Screen name="insights" options={{ title:'AI Brain',tabBarIcon: ({focused}) => <TabIcon emoji="🧠" focused={focused}/> }}/>
        <Tabs.Screen name="rewards"  options={{ title:'Rewards', tabBarIcon: ({focused}) => <TabIcon emoji="🏆" focused={focused}/> }}/>
      </Tabs>
    </View>
  );
}
