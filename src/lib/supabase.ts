import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://nqdnrzcvdifbinbvzqkt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZG5yemN2ZGlmYmluYnZ6cWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTQxMzYsImV4cCI6MjA4Nzk3MDEzNn0.fJhCDfEsKCjlxMWx6l_qimvRlZrnjJL9WeW2gTFupEs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
