/**
 * AGES Malaysia Website - Public Supabase Configuration
 * READ-ONLY client initialization using Publishable Key.
 */

const SUPABASE_URL = 'https://vbownnuihefstjfhxybq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BHLc_G9xevBPI6twUjWHOA_vY0BcuyB';

// Global Read-Only Supabase Client instance for the public website
let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    } else {
      console.warn('Supabase JS SDK not loaded yet. Retrying initialization...');
    }
  }
  return supabaseClient;
}
