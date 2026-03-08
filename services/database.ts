
import { db as supabaseDb } from './supabaseService';

// Always use Supabase directly - no local fallback
export const db = supabaseDb;

console.log('Database initialized - using Supabase directly');
