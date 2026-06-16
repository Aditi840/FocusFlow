// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { checkSubscriptionStatus } from '@/lib/subscription';
import { router } from 'expo-router';

const queryClient = new QueryClient();

export default function RootLayout() {
  const setUser        = useStore((s) => s.setUser);
  const setIsPremium   = useStore((s) => s.setIsPremium);
  const setTrialStart  = useStore((s) => s.setTrialStartDate);

  useEffect(() => {
    // Check existing session on launch
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const u = data.session.user;
        setUser({
          id:    u.id,
          email: u.email!,
          name:  u.user_metadata?.full_name ?? '',
          phone: u.user_metadata?.phone ?? '',
        });

        // Check trial / subscription from Supabase
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('is_premium, trial_start, expires_at')
          .eq('user_id', u.id)
          .single();

        if (sub) {
          setTrialStart(sub.trial_start);
          const subStatus = await checkSubscriptionStatus(u.id);
          setIsPremium(subStatus.isPremium);
        }

        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.replace('/(auth)/login');
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)"    options={{ animation: 'fade' }}/>
          <Stack.Screen name="(tabs)"    options={{ animation: 'fade' }}/>
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
