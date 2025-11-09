import { supabaseAdmin } from '../lib/supabaseClient.js'

export async function supabaseAuthRequired(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' })
  }

  const token = authHeader.split(' ')[1]

  // Validasi token ke Supabase
  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Token tidak valid' })
  }

  req.user = data.user
  next()
}
