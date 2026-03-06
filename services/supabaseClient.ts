
import { createClient } from '@supabase/supabase-js';

// دالة متقدمة لجلب المتغيرات من أي مكان ممكن
const getEnv = (key: string): string => {
  // محاولة جلب القيم من process.env (الأولوية القصوى)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }

  // محاولة جلب القيم من import.meta.env (Vite)
  // @ts-ignore
  const env = import.meta.env || {};
  if (env[key]) return env[key];
  if (env[`VITE_${key}`]) return env[`VITE_${key}`];

  // قيم افتراضية للمشروع الحالي
  if (key === 'SUPABASE_URL' || key === 'VITE_SUPABASE_URL') return 'https://gggxogkirduktbdyikjr.supabase.co';
  if (key === 'SUPABASE_ANON_KEY' || key === 'VITE_SUPABASE_ANON_KEY') return 'sb_publishable_cQPi0e3zlqIzCDPJmDZNRA_u59KAIHs';

  // جلب من التخزين المحلي كخيار أخير
  return window.localStorage.getItem(`SUPABASE_CUSTOM_${key}`) || '';
};

// التحقق من التهيئة
export const isSupabaseConfigured = () => {
  const url = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');
  return url && url.startsWith('http') && key && key.length > 10;
};

// تحديد وضع قاعدة البيانات (محلي أو سحابي)
// الوضع الافتراضي دائماً هو 'local' ما لم يختر المستخدم 'supabase' صراحةً
export const getDbMode = (): 'local' | 'supabase' => {
  const savedMode = window.localStorage.getItem('DB_MODE');
  if (savedMode === 'supabase') return 'supabase';
  return 'local'; // الافتراضي دائماً محلي
};

export const setDbMode = (mode: 'local' | 'supabase') => {
  window.localStorage.setItem('DB_MODE', mode);
};

export const switchAndReload = (mode: 'local' | 'supabase') => {
  setDbMode(mode);
  window.location.reload();
};

// إنشاء العميل
const createSupabase = () => {
  const url = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || 'https://missing-url.supabase.co';
  const key = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || 'missing-key';

  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
};

export let supabase = createSupabase();

// دالة لتحديث الإعدادات يدوياً
export const updateSupabaseConfig = (url: string, key: string) => {
  window.localStorage.setItem('SUPABASE_CUSTOM_SUPABASE_URL', url);
  window.localStorage.setItem('SUPABASE_CUSTOM_SUPABASE_ANON_KEY', key);
  supabase = createClient(url, key);
  return isSupabaseConfigured();
};
