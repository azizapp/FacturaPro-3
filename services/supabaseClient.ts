
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://isvhmsatlnwykmwukurh.supabase.co';
const supabaseAnonKey = 'sb_publishable_4lFHcw3ymRZBCN_tlmCE7Q_pW_qhaS1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
