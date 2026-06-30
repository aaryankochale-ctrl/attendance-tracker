import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  const { data: subjects, error } = await supabase.from('subjects').select('*');
  if (error) {
    console.error("Error fetching:", error);
    return;
  }
  
  if (subjects && subjects.length > 0) {
    console.log("Original first subject:", subjects[0]);
    const firstId = subjects[0].id;
    
    // Try updating it
    const { error: updateError } = await supabase.from('subjects').upsert([
      { ...subjects[0], startDate: '2026-08-05' }
    ]);
    
    if (updateError) {
      console.error("Error updating:", updateError);
    } else {
      console.log("Update succeeded!");
    }
    
    // Fetch again
    const { data: refetch } = await supabase.from('subjects').select('*').eq('id', firstId);
    console.log("Refetched subject:", refetch?.[0]);
  }
}

testSupabase();
