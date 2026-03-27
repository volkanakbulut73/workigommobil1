import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://toqroogfufzgxsxemfeh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcXJvb2dmdWZ6Z3hzeGVtZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjQyMjksImV4cCI6MjA4MDAwMDIyOX0.KZNfT1C6IBpx6eApebrnM_zzBivxAOqXAAR3iaw_9UI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
