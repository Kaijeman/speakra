import { supabase } from '../lib/supabaseClient'

const TOKEN_KEY = 'speakra_access_token'

export async function registerWithEmail(name, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  })
  if (error) throw error
  return data
}

export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error

  const accessToken = data.session?.access_token
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken)
  }
  return data
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  supabase.auth.signOut()
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}
