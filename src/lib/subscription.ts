// src/lib/subscription.ts
import { supabase } from './supabase';

export const TRIAL_DAYS = 30;
export const PRICE_INR  = 99;
export const PLAN_MONTHS = 6;

// ── Trial logic ───────────────────────────────────────────────────────
export function getTrialDaysLeft(trialStartDate: string | null): number {
  if (!trialStartDate) return TRIAL_DAYS;
  const diff = Math.floor(
    (Date.now() - new Date(trialStartDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, TRIAL_DAYS - diff);
}

export function isTrialExpired(trialStartDate: string | null): boolean {
  return getTrialDaysLeft(trialStartDate) === 0;
}

export function trialExpiryDate(trialStartDate: string): string {
  const d = new Date(trialStartDate);
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Supabase: mark user as premium after payment ──────────────────────
export async function activatePremium(userId: string, razorpayPaymentId: string) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + PLAN_MONTHS);

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id:            userId,
      is_premium:         true,
      plan:               '6_months_99',
      razorpay_payment_id: razorpayPaymentId,
      started_at:         new Date().toISOString(),
      expires_at:         expiresAt.toISOString(),
    });

  if (error) throw error;
  return expiresAt;
}

// ── Check premium status from Supabase (called on app launch) ─────────
export async function checkSubscriptionStatus(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('is_premium, expires_at, plan')
    .eq('user_id', userId)
    .single();

  if (error || !data) return { isPremium: false };

  const expired = data.expires_at
    ? new Date(data.expires_at) < new Date()
    : false;

  return {
    isPremium:  data.is_premium && !expired,
    expiresAt:  data.expires_at,
    plan:       data.plan,
  };
}

// ── Razorpay payment initiation ───────────────────────────────────────
// In production: install react-native-razorpay and call RazorpayCheckout.open()
export interface RazorpayOptions {
  description: string;
  image:       string;
  currency:    string;
  key:         string;
  amount:      number;    // in paise (99 * 100 = 9900)
  name:        string;
  prefill:     { email: string; contact: string; name: string };
  theme:       { color: string };
}

export function buildRazorpayOptions(
  email: string,
  phone: string,
  name: string,
): RazorpayOptions {
  return {
    description: 'FocusFlow Premium — 6 Months',
    image:       'https://your-cdn.com/focusflow-logo.png',
    currency:    'INR',
    key:         'YOUR_RAZORPAY_KEY_ID',        // free to get at razorpay.com
    amount:      PRICE_INR * 100,               // 9900 paise = ₹99
    name:        'FocusFlow',
    prefill:     { email, contact: phone, name },
    theme:       { color: '#7F77DD' },
  };
}

/*
  RAZORPAY SETUP (FREE):
  1. Sign up at https://dashboard.razorpay.com (free, instant)
  2. npm install react-native-razorpay
  3. In your payment screen:

  import RazorpayCheckout from 'react-native-razorpay';
  import { buildRazorpayOptions, activatePremium } from '@/lib/subscription';

  const handlePayment = async () => {
    const options = buildRazorpayOptions(email, phone, name);
    try {
      const data = await RazorpayCheckout.open(options);
      // data.razorpay_payment_id — payment successful
      await activatePremium(userId, data.razorpay_payment_id);
      setIsPremium(true);
    } catch (err) {
      // payment cancelled or failed
    }
  };
*/
