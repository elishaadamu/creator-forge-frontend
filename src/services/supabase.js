/**
 * Creator Forge — Supabase client
 *
 * Set these in your .env.local (dev) and Vercel env vars (prod):
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJhbGci...
 *
 * Get both from: supabase.com → your project → Settings → API
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabaseClient = null
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export const supabase = supabaseClient

// ── Auth helpers ───────────────────────────────────────────────────────────────

/** Sign up with email + password */
export async function signUp(email, password) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

/** Sign in with email + password */
export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/** Sign out */
export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** Get current session */
export async function getSession() {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/** Get current user */
export async function getUser() {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── Creator profiles ───────────────────────────────────────────────────────────
// Table: creator_profiles (id, user_id, handle, platform, data jsonb, created_at)

export async function saveCreatorProfile(userId, creatorData) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('creator_profiles')
    .upsert({
      user_id:  userId,
      handle:   creatorData.handle,
      platform: creatorData.platform,
      data:     creatorData,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  if (error) throw error
  return data
}

export async function loadCreatorProfile(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data?.data || null
}

// ── Generated packs ────────────────────────────────────────────────────────────
// Table: generated_packs (id, user_id, creator_handle, pack jsonb, image_url, created_at)

export async function saveGeneratedPack(userId, creatorHandle, pack, imageUrl) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('generated_packs')
    .insert({
      user_id:        userId,
      creator_handle: creatorHandle,
      pack,
      image_url:      imageUrl || null,
      created_at:     new Date().toISOString(),
    })
  if (error) throw error
  return data
}

export async function loadLatestPack(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('generated_packs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}
