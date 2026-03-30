const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://toqroogfufzgxsxemfeh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcXJvb2dmdWZ6Z3hzeGVtZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjQyMjksImV4cCI6MjA4MDAwMDIyOX0.KZNfT1C6IBpx6eApebrnM_zzBivxAOqXAAR3iaw_9UI');

async function testDelete() {
  const { data, error } = await supabase.from('messages').delete().eq('id', 'b8c8d2d6-4e51-4e78-9e53-61b6015d91e6').select();
  console.log('DATA:', data);
  console.log('ERROR:', error);
}

testDelete();
