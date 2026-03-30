const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://toqroogfufzgxsxemfeh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcXJvb2dmdWZ6Z3hzeGVtZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjQyMjksImV4cCI6MjA4MDAwMDIyOX0.KZNfT1C6IBpx6eApebrnM_zzBivxAOqXAAR3iaw_9UI');

async function test() {
  const { data, error } = await supabase.from('swap_listings').select('*, profiles(full_name)').limit(3);
  console.log("DATA:");
  console.log(JSON.stringify(data, null, 2));
  console.log("ERROR:");
  console.log(error);
}

test();
