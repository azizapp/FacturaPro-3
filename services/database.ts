
import { db as supabaseDb } from './supabaseService';
import { localDb } from './localService';
import { getDbMode } from './supabaseClient';

// Get the current mode
const mode = getDbMode();

// Use localDb if mode is 'local', otherwise use supabaseDb
export const db = mode === 'local' ? localDb : supabaseDb;

console.log(`Application is running in ${mode} mode`);
