const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nqdnrzcvdifbinbvzqkt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZG5yemN2ZGlmYmluYnZ6cWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTQxMzYsImV4cCI6MjA4Nzk3MDEzNn0.fJhCDfEsKCjlxMWx6l_qimvRlZrnjJL9WeW2gTFupEs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const userId = '8fe4c0e8-d44b-4efa-8f31-35b4a4ff0e01';
  const { data, error } = await supabase
          .from('transactions')
          .select(`*, profiles!transactions_seeker_id_fkey(full_name, rating, avatar_url)`)
          .or(`seeker_id.eq.${userId},supporter_id.eq.${userId}`)
          .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Query success! Number of items:', data.length);
  }
}

test();
