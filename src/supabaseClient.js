import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aurmgadrlpqzdydrirjj.supabase.co';
const supabaseAnonKey = 'sb_publishable_qhIXU71kbn0BacNU9E56mw_M1r_6vPq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);