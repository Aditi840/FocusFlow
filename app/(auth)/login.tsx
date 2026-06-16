// app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { getTheme } from '@/theme';

export default function LoginScreen() {
  const dark = useStore((s) => s.dark);
  const T    = getTheme(dark);
  const setUser         = useStore((s) => s.setUser);
  const setTrialStartDate = useStore((s) => s.setTrialStartDate);

  const [tab, setTab]       = useState<'login' | 'signup'>('login');
  const [mode, setMode]     = useState<'password' | 'otp'>('password');
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [phone, setPhone]   = useState('');
  const [password, setPass] = useState('');
  const [confirm, setConf]  = useState('');
  const [otp, setOtp]       = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const S = StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    scroll:    { flexGrow: 1, padding: 24, paddingTop: 60 },
    logo:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 },
    logoOrb:   { width: 44, height: 44, borderRadius: 14, backgroundColor: '#7F77DD',
                 alignItems: 'center', justifyContent: 'center' },
    logoText:  { fontSize: 22, fontWeight: '900', color: T.text },
    title:     { fontSize: 26, fontWeight: '900', color: T.text, marginBottom: 6 },
    sub:       { fontSize: 14, color: T.textSec, marginBottom: 28, lineHeight: 20 },
    tabs:      { flexDirection: 'row', backgroundColor: T.bg2,
                 borderRadius: 14, padding: 4, marginBottom: 24 },
    tabBtn:    { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
    tabTxt:    { fontSize: 13, fontWeight: '700' },
    modeTabs:  { flexDirection: 'row', backgroundColor: T.bg2,
                 borderRadius: 14, padding: 4, marginBottom: 20 },
    label:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.6,
                 color: T.textSec, marginBottom: 6 },
    input:     { backgroundColor: T.inputBg, borderWidth: 1.5,
                 borderColor: T.inputBorder, borderRadius: 14,
                 paddingHorizontal: 16, paddingVertical: 14,
                 fontSize: 15, color: T.text, marginBottom: 16 },
    inputRow:  { position: 'relative', marginBottom: 16 },
    eyeBtn:    { position: 'absolute', right: 14, top: 14, padding: 2 },
    btnMain:   { height: 52, borderRadius: 16, alignItems: 'center',
                 justifyContent: 'center', marginTop: 8,
                 backgroundColor: '#7F77DD',
                 shadowColor: '#7F77DD', shadowOffset: {width:0,height:6},
                 shadowOpacity: 0.38, shadowRadius: 12, elevation: 8 },
    btnMainTxt:{ fontSize: 16, fontWeight: '800', color: '#fff' },
    divider:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
    divLine:   { flex: 1, height: 1, backgroundColor: T.border },
    divTxt:    { fontSize: 12, color: T.textSec, fontWeight: '600' },
    socialBtn: { height: 50, borderRadius: 16, borderWidth: 1.5,
                 borderColor: T.border, alignItems: 'center',
                 justifyContent: 'center', marginBottom: 12 },
    socialTxt: { fontSize: 14, fontWeight: '700', color: T.text },
    footer:    { flexDirection: 'row', justifyContent: 'center',
                 marginTop: 24, gap: 4 },
    footerTxt: { fontSize: 14, color: T.textSec },
    footerLink:{ fontSize: 14, fontWeight: '700', color: '#7F77DD' },
    otpRow:    { flexDirection: 'row', gap: 10, justifyContent: 'center',
                 marginVertical: 20 },
    otpBox:    { width: 46, height: 54, borderRadius: 14, textAlign: 'center',
                 fontSize: 22, fontWeight: '800', borderWidth: 1.5,
                 borderColor: T.inputBorder, backgroundColor: T.inputBg,
                 color: T.text },
    trialBanner:{ backgroundColor: dark ? 'rgba(29,158,117,0.12)' : '#E1F5EE',
                  borderRadius: 14, padding: 12, marginBottom: 20,
                  borderWidth: 1, borderColor: 'rgba(29,158,117,0.25)' },
    trialTxt:  { fontSize: 13, color: '#1D9E75', fontWeight: '600',
                 textAlign: 'center', lineHeight: 20 },
  });

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Please fill all fields'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { Alert.alert('Login failed', error.message); return; }
    if (data.user) {
      setUser({ id: data.user.id, email: data.user.email!, name: name, phone });
      router.replace('/(tabs)/home');
    }
  }

  async function handleSignup() {
    if (!name || !email || !phone || !password)
      { Alert.alert('Please fill all fields'); return; }
    if (password !== confirm)
      { Alert.alert('Passwords do not match'); return; }
    if (password.length < 8)
      { Alert.alert('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, phone } },
    });
    setLoading(false);
    if (error) { Alert.alert('Signup failed', error.message); return; }
    if (data.user) {
      setUser({ id: data.user.id, email: data.user.email!, name, phone });
      setTrialStartDate(new Date().toISOString());
      Alert.alert('✅ Account created!', 'Your 30-day free trial has started.');
      router.replace('/(tabs)/home');
    }
  }

  async function handleSendOTP() {
    if (!email) { Alert.alert('Enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setOtpSent(true);
    Alert.alert('📬 OTP Sent', `Check ${email} for your 6-digit code.`);
  }

  async function handleVerifyOTP() {
    if (otp.length < 6) { Alert.alert('Enter the 6-digit code'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email, token: otp, type: 'email',
    });
    setLoading(false);
    if (error) { Alert.alert('Invalid code', error.message); return; }
    if (data.user) {
      setUser({ id: data.user.id, email: data.user.email!, name: '', phone });
      setTrialStartDate(new Date().toISOString());
      router.replace('/(tabs)/home');
    }
  }

  async function handleForgotPassword() {
    if (!email) { Alert.alert('Enter your email first'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'focusflow://reset-password',
    });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('📧 Check your email', 'A password reset link has been sent.');
    setForgotMode(false);
  }

  if (forgotMode) return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.container}>
      <ScrollView contentContainerStyle={S.scroll}>
        <View style={S.logo}>
          <View style={S.logoOrb}><Text style={{fontSize:22}}>🎯</Text></View>
          <Text style={S.logoText}>FocusFlow</Text>
        </View>
        <Text style={{fontSize:48,textAlign:'center',marginBottom:16}}>🔐</Text>
        <Text style={S.title}>Reset password</Text>
        <Text style={S.sub}>Enter your email and we'll send a reset link.</Text>
        <Text style={S.label}>EMAIL ADDRESS</Text>
        <TextInput style={S.input} value={email} onChangeText={setEmail}
          placeholder="you@example.com" keyboardType="email-address"
          autoCapitalize="none" placeholderTextColor={T.textSec}/>
        <TouchableOpacity style={[S.btnMain,{backgroundColor:'linear-gradient'}]}
          onPress={handleForgotPassword} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff"/>
            : <Text style={S.btnMainTxt}>Send Reset Link</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>setForgotMode(false)} style={{marginTop:16,alignItems:'center'}}>
          <Text style={S.footerLink}>← Back to sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.container}>
      <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={S.logo}>
          <View style={S.logoOrb}><Text style={{fontSize:22}}>🎯</Text></View>
          <Text style={S.logoText}>FocusFlow</Text>
        </View>

        {/* Trial banner */}
        <View style={S.trialBanner}>
          <Text style={S.trialTxt}>
            🎉 30-day FREE trial · Then ₹99 for 6 months{'\n'}No credit card needed to start
          </Text>
        </View>

        {/* Login / Signup tabs */}
        <View style={S.tabs}>
          {(['login','signup'] as const).map((t) => (
            <TouchableOpacity key={t} style={[S.tabBtn,
              {backgroundColor: tab===t ? '#7F77DD' : 'transparent'}]}
              onPress={() => setTab(t)}>
              <Text style={[S.tabTxt, {color: tab===t ? '#fff' : T.textSec}]}>
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'login' && <>
          {/* Login mode: password or OTP */}
          <View style={S.modeTabs}>
            {(['password','otp'] as const).map((m) => (
              <TouchableOpacity key={m} style={[S.tabBtn,
                {backgroundColor: mode===m ? '#7F77DD' : 'transparent'}]}
                onPress={() => setMode(m)}>
                <Text style={[{fontSize:12,fontWeight:'700'},
                  {color: mode===m ? '#fff' : T.textSec}]}>
                  {m === 'password' ? '🔒 Password' : '📱 OTP / Magic Link'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={S.label}>EMAIL ADDRESS</Text>
          <TextInput style={S.input} value={email} onChangeText={setEmail}
            placeholder="you@example.com" keyboardType="email-address"
            autoCapitalize="none" placeholderTextColor={T.textSec}/>

          {mode === 'password' && <>
            <Text style={S.label}>PASSWORD</Text>
            <View style={S.inputRow}>
              <TextInput style={[S.input,{marginBottom:0,paddingRight:46}]}
                value={password} onChangeText={setPass}
                placeholder="••••••••" secureTextEntry={!pwVisible}
                placeholderTextColor={T.textSec}/>
              <TouchableOpacity style={S.eyeBtn} onPress={()=>setPwVisible(v=>!v)}>
                <Text style={{fontSize:18}}>{pwVisible ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={()=>setForgotMode(true)}
              style={{alignSelf:'flex-end',marginBottom:16,marginTop:-8}}>
              <Text style={S.footerLink}>Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.btnMain} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff"/>
                : <Text style={S.btnMainTxt}>Sign In</Text>}
            </TouchableOpacity>
          </>}

          {mode === 'otp' && <>
            {!otpSent ? (
              <TouchableOpacity style={S.btnMain} onPress={handleSendOTP} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff"/>
                  : <Text style={S.btnMainTxt}>Send OTP Code 📬</Text>}
              </TouchableOpacity>
            ) : (
              <>
                <Text style={[S.label,{textAlign:'center',marginTop:8}]}>
                  ENTER 6-DIGIT CODE
                </Text>
                <View style={S.otpRow}>
                  <TextInput style={S.otpBox} maxLength={6} keyboardType="number-pad"
                    value={otp} onChangeText={setOtp} placeholderTextColor={T.textSec}
                    placeholder="------"/>
                </View>
                <TouchableOpacity style={S.btnMain} onPress={handleVerifyOTP} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff"/>
                    : <Text style={S.btnMainTxt}>Verify OTP ✓</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSendOTP}
                  style={{marginTop:14,alignItems:'center'}}>
                  <Text style={S.footerLink}>Resend code</Text>
                </TouchableOpacity>
              </>
            )}
          </>}
        </>}

        {tab === 'signup' && <>
          <Text style={S.label}>FULL NAME</Text>
          <TextInput style={S.input} value={name} onChangeText={setName}
            placeholder="Your name" placeholderTextColor={T.textSec}/>
          <Text style={S.label}>EMAIL ADDRESS</Text>
          <TextInput style={S.input} value={email} onChangeText={setEmail}
            placeholder="you@example.com" keyboardType="email-address"
            autoCapitalize="none" placeholderTextColor={T.textSec}/>
          <Text style={S.label}>PHONE NUMBER</Text>
          <TextInput style={S.input} value={phone} onChangeText={setPhone}
            placeholder="+91 98765 43210" keyboardType="phone-pad"
            placeholderTextColor={T.textSec}/>
          <Text style={S.label}>PASSWORD</Text>
          <View style={S.inputRow}>
            <TextInput style={[S.input,{marginBottom:0,paddingRight:46}]}
              value={password} onChangeText={setPass}
              placeholder="At least 8 characters" secureTextEntry={!pwVisible}
              placeholderTextColor={T.textSec}/>
            <TouchableOpacity style={S.eyeBtn} onPress={()=>setPwVisible(v=>!v)}>
              <Text style={{fontSize:18}}>{pwVisible ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={S.label}>CONFIRM PASSWORD</Text>
          <TextInput style={S.input} value={confirm} onChangeText={setConf}
            placeholder="Repeat password" secureTextEntry={!pwVisible}
            placeholderTextColor={T.textSec}/>
          <TouchableOpacity style={S.btnMain} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff"/>
              : <Text style={S.btnMainTxt}>Create Account — Free Trial 🎉</Text>}
          </TouchableOpacity>
        </>}

        {/* Divider */}
        <View style={S.divider}>
          <View style={S.divLine}/>
          <Text style={S.divTxt}>or continue with</Text>
          <View style={S.divLine}/>
        </View>

        {/* Google OAuth (Supabase handles this — free) */}
        <TouchableOpacity style={S.socialBtn} onPress={async () => {
          await supabase.auth.signInWithOAuth({ provider: 'google' });
        }}>
          <Text style={S.socialTxt}>🔵  Continue with Google</Text>
        </TouchableOpacity>

        <View style={S.footer}>
          <Text style={S.footerTxt}>
            {tab==='login' ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <TouchableOpacity onPress={()=>setTab(tab==='login'?'signup':'login')}>
            <Text style={S.footerLink}>
              {tab==='login' ? 'Sign up free' : 'Sign in'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
