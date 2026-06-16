// ─── src/lib/supabase.ts ────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const supabaseUrl     = Constants.expoConfig?.extra?.supabaseUrl     ?? '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? '';

// Secure token storage (uses Android Keystore / iOS Keychain)
const SecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage:          SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles:        { Row: Profile };
      focus_sessions:  { Row: FocusSession };
      reflections:     { Row: Reflection };
      habits:          { Row: Habit };
      habit_logs:      { Row: HabitLog };
      mood_logs:       { Row: MoodLog };
      ml_insights:     { Row: MLInsight };
      achievements:    { Row: Achievement };
      streaks:         { Row: Streak };
    };
  };
};

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak: number;
  best_streak: number;
  created_at: string;
  updated_at: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  dark_mode: boolean;
  notifications_enabled: boolean;
  focus_reminder_time: string;
  reflection_reminder_time: string;
  daily_focus_goal_minutes: number;
}

export interface FocusSession {
  id: string;
  user_id: string;
  mode: 'pomodoro' | 'deep_work' | 'custom';
  duration_minutes: number;
  completed: boolean;
  focus_score: number | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
}

export interface Reflection {
  id: string;
  user_id: string;
  date: string;
  mood_score: number;
  productive: string;
  improved: string;
  tomorrow: string;
  stress_trigger: string;
  grateful: string;
  energy_level: number;
  overall_score: number | null;
  sentiment_score: number | null;
  detected_triggers: string[];
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  frequency: 'daily' | 'weekdays' | 'weekends';
  reminder_time: string | null;
  is_active: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  date: string;
}

export interface MoodLog {
  id: string;
  user_id: string;
  score: number;
  label: string;
  logged_at: string;
}

export interface MLInsight {
  id: string;
  user_id: string;
  type: 'pattern' | 'trend' | 'anomaly' | 'sentiment' | 'recommendation';
  title: string;
  message: string;
  confidence: number;
  color: string;
  emoji: string;
  generated_at: string;
  data_snapshot: Record<string, unknown>;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
  xp_awarded: number;
}

export interface Streak {
  id: string;
  user_id: string;
  type: 'focus' | 'reflection' | 'habit';
  current: number;
  best: number;
  last_activity: string;
}
