const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://mvjupispvrmnrwnvhhig.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12anVwaXNwdnJtbnJ3bnZoaGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTM1MDYsImV4cCI6MjA5NDk4OTUwNn0.GALU8GysqD1CgzLRQeYIqVxBdmzton739iXDpFUOwow';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('telemetria_neumaticos').select('*').limit(5);
  console.log('Error:', error);
  console.log('Data:', data?.length);
}
test();
