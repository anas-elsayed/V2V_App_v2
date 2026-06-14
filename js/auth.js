// ============================================
// auth.js — Supabase authentication
// Login, register, logout, session check
// ============================================

const SUPABASE_URL = 'https://fhbwzsrcotdskmortlmv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gYec4O9iBheDnT4r0oRxNw_qNYKJOkW';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- Login ----
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data.user;
}

// ---- Register ----
async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  if (error) throw error;
  return data.user;
}

// ---- Logout ----
async function logout() {
  await supabase.auth.signOut();
}

// ---- Get current session ----
async function getSession() {
  const { data } = await supabase.session();
  return data?.session ?? null;
}

// ---- Get current user ----
async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

// ---- Save alert event to Supabase database ----
async function logEvent(type, message, lat, lng) {
  await supabase.from('events').insert({
    type,
    message,
    lat: lat ?? null,
    lng: lng ?? null,
    created_at: new Date().toISOString()
  });
}
