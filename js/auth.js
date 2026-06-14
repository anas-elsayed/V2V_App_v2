// ============================================
// auth.js — Supabase authentication
// ============================================

const SUPABASE_URL = 'https://fhbwzsrcotdskmortlmv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gYec4O9iBheDnT4r0oRxNw_qNYKJOkW';

// Fix: renamed from 'supabase' to 'sb' to avoid conflict with library
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function login(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data.user;
}

async function register(email, password) {
  const { data, error } = await sb.auth.signUp({
    email,
    password
  });
  if (error) throw error;
  return data.user;
}

async function logout() {
  await sb.auth.signOut();
}

async function getUser() {
  const { data } = await sb.auth.getUser();
  return data?.user ?? null;
}

async function logEvent(type, message, lat, lng) {
  await sb.from('events').insert({
    type,
    message,
    lat: lat ?? null,
    lng: lng ?? null,
    created_at: new Date().toISOString()
  });
}
