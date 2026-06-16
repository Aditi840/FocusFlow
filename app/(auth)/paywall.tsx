// app/(auth)/paywall.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/store';
import { getTheme } from '@/theme';
import { getTrialDaysLeft, trialExpiryDate, buildRazorpayOptions, activatePremium } from '@/lib/subscription';

// In production: import RazorpayCheckout from 'react-native-razorpay';

export default function PaywallScreen() {
  const dark            = useStore((s) => s.dark);
  const T               = getTheme(dark);
  const user            = useStore((s) => s.user);
  const trialStartDate  = useStore((s) => s.trialStartDate);
  const setIsPremium    = useStore((s) => s.setIsPremium);
  const [loading, setLoading] = useState(false);

  const daysLeft = getTrialDaysLeft(trialStartDate);
  const expiry   = trialStartDate ? trialExpiryDate(trialStartDate) : '';
  const expired  = daysLeft === 0;

  const S = StyleSheet.create({
    container:  { flex: 1, backgroundColor: T.bg },
    scroll:     { flexGrow: 1, padding: 24, paddingTop: 60 },
    hero:       { alignItems: 'center', marginBottom: 32 },
    heroOrb:    { width: 88, height: 88, borderRadius: 26,
                  backgroundColor: '#7F77DD', alignItems: 'center',
                  justifyContent: 'center', marginBottom: 18,
                  shadowColor: '#7F77DD', shadowOffset: {width:0,height:8},
                  shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
    heroTitle:  { fontSize: 28, fontWeight: '900', color: T.text,
                  marginBottom: 8, textAlign: 'center' },
    heroSub:    { fontSize: 14, color: T.textSec, textAlign: 'center', lineHeight: 22 },
    trialCard:  { borderRadius: 20, padding: 20, marginBottom: 20,
                  backgroundColor: expired
                    ? (dark ? 'rgba(216,90,48,0.12)' : '#FAECE7')
                    : (dark ? 'rgba(29,158,117,0.12)' : '#E1F5EE'),
                  borderWidth: 1,
                  borderColor: expired ? 'rgba(216,90,48,0.3)' : 'rgba(29,158,117,0.3)' },
    trialTitle: { fontSize: 16, fontWeight: '800',
                  color: expired ? '#D85A30' : '#1D9E75', marginBottom: 6 },
    trialSub:   { fontSize: 13, color: T.textSec, lineHeight: 20 },
    priceCard:  { backgroundColor: dark ? 'rgba(127,119,221,0.15)' : '#EEEDFE',
                  borderRadius: 20, padding: 24, marginBottom: 20,
                  borderWidth: 1, borderColor: 'rgba(127,119,221,0.3)',
                  alignItems: 'center' },
    price:      { fontSize: 48, fontWeight: '900', color: '#7F77DD', lineHeight: 56 },
    priceSub:   { fontSize: 14, color: T.textSec, marginTop: 4 },
    perMonth:   { fontSize: 12, color: '#1D9E75', fontWeight: '700', marginTop: 4 },
    features:   { marginBottom: 24 },
    featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                  marginBottom: 14 },
    featureIcon:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0 },
    featureTxt: { flex: 1 },
    featureTitle:{ fontSize: 13, fontWeight: '700', color: T.text },
    featureSub: { fontSize: 12, color: T.textSec, marginTop: 2, lineHeight: 18 },
    btnMain:    { height: 56, borderRadius: 18, alignItems: 'center',
                  justifyContent: 'center', backgroundColor: '#7F77DD',
                  shadowColor: '#7F77DD', shadowOffset: {width:0,height:6},
                  shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
                  marginBottom: 14 },
    btnMainTxt: { fontSize: 17, fontWeight: '900', color: '#fff' },
    btnSkip:    { height: 48, borderRadius: 14, alignItems: 'center',
                  justifyContent: 'center', borderWidth: 1.5, borderColor: T.border },
    btnSkipTxt: { fontSize: 14, fontWeight: '700', color: T.textSec },
    legal:      { fontSize: 11, color: T.textSec, textAlign: 'center',
                  marginTop: 16, lineHeight: 17 },
  });

  const FEATURES = [
    { emoji:'🧠', color:'#7F77DD', title:'AI Pattern Detection',
      sub:'Prophet + Isolation Forest + Gemma 2B NLP — all running free on your device.' },
    { emoji:'🎯', color:'#1D9E75', title:'Unlimited Focus Sessions',
      sub:'Pomodoro, Deep Work & Custom modes. Ambient sounds included.' },
    { emoji:'📓', color:'#D4537E', title:'Full Reflection Journal',
      sub:'5-question daily check-in with on-device sentiment analysis.' },
    { emoji:'🏆', color:'#BA7517', title:'Gamification System',
      sub:'XP, levels, streaks, achievements and weekly challenges.' },
    { emoji:'🔔', color:'#D85A30', title:'Smart Notifications',
      sub:'Daily focus reminders, reflection nudges, streak alerts.' },
    { emoji:'🔄', color:'#6C5FE6', title:'Cross-Device Sync',
      sub:'Supabase real-time database keeps all your data in sync.' },
  ];

  async function handlePayment() {
    if (!user) return;
    setLoading(true);

    // ── DEMO PAYMENT (replace with real Razorpay in prod) ──────────
    // const options = buildRazorpayOptions(user.email, user.phone, user.name);
    // const data = await RazorpayCheckout.open(options);
    // await activatePremium(user.id, data.razorpay_payment_id);
    // ──────────────────────────────────────────────────────────────

    setTimeout(async () => {
      try {
        setIsPremium(true);
        setLoading(false);
        Alert.alert('🎉 Payment Successful!',
          'Welcome to FocusFlow Premium! Enjoy 6 months of full access.',
          [{ text: 'Let\'s Go!', onPress: () => router.replace('/(tabs)/home') }]
        );
      } catch {
        setLoading(false);
        Alert.alert('Payment failed', 'Please try again.');
      }
    }, 1500);
  }

  return (
    <ScrollView style={S.container} contentContainerStyle={S.scroll}>

      {/* Hero */}
      <View style={S.hero}>
        <View style={S.heroOrb}><Text style={{fontSize:40}}>🎯</Text></View>
        <Text style={S.heroTitle}>
          {expired ? 'Your Free Trial Has Ended' : 'FocusFlow Premium'}
        </Text>
        <Text style={S.heroSub}>
          {expired
            ? 'Subscribe to continue your focus journey and keep all your data.'
            : 'Get full access to every feature for just ₹99 for 6 months.'}
        </Text>
      </View>

      {/* Trial status card */}
      <View style={S.trialCard}>
        <Text style={S.trialTitle}>
          {expired ? '⚠️ Trial Expired' : `✅ ${daysLeft} Days of Free Trial Remaining`}
        </Text>
        <Text style={S.trialSub}>
          {expired
            ? 'Your 30-day free trial ended. Subscribe now to keep your streaks, XP, and all journal entries.'
            : `Your free trial runs until ${expiry}. Subscribe anytime before it ends to never lose access.`}
        </Text>
      </View>

      {/* Price */}
      <View style={S.priceCard}>
        <Text style={{fontSize:13,color:T.textSec,fontWeight:'700',letterSpacing:1,marginBottom:4}}>
          6-MONTH PLAN
        </Text>
        <Text style={S.price}>₹99</Text>
        <Text style={S.priceSub}>one-time for 6 months</Text>
        <Text style={S.perMonth}>That's just ₹16.50/month 💚</Text>
        <View style={{flexDirection:'row',gap:8,marginTop:14,flexWrap:'wrap',justifyContent:'center'}}>
          {['No auto-renewal','Secure Razorpay','Cancel anytime'].map((t) => (
            <View key={t} style={{backgroundColor:'rgba(29,158,117,0.12)',borderRadius:20,
              paddingHorizontal:10,paddingVertical:4}}>
              <Text style={{fontSize:11,color:'#1D9E75',fontWeight:'700'}}>✓ {t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Features */}
      <View style={S.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={S.featureRow}>
            <View style={[S.featureIcon,{backgroundColor:f.color+'18'}]}>
              <Text style={{fontSize:20}}>{f.emoji}</Text>
            </View>
            <View style={S.featureTxt}>
              <Text style={S.featureTitle}>{f.title}</Text>
              <Text style={S.featureSub}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Pay button */}
      <TouchableOpacity style={S.btnMain} onPress={handlePayment} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff"/>
          : <Text style={S.btnMainTxt}>Pay ₹99 via Razorpay 🔐</Text>}
      </TouchableOpacity>

      {/* Skip if trial not expired */}
      {!expired && (
        <TouchableOpacity style={S.btnSkip} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={S.btnSkipTxt}>Continue with Free Trial</Text>
        </TouchableOpacity>
      )}

      <Text style={S.legal}>
        Payment processed securely by Razorpay.{'\n'}
        No subscription — one-time payment, 6 months access.{'\n'}
        Your data is stored privately on Supabase with row-level security.
      </Text>

    </ScrollView>
  );
}
