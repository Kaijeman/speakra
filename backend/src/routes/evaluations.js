import { Router } from 'express'
import upload from '../middleware/upload.js'
import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'
import { supabaseAuthRequired } from '../middleware/authSupabase.js'
import { supabaseAdmin } from '../lib/supabaseClient.js'

const router = Router()

// POST /api/evaluations
router.post('/', supabaseAuthRequired, upload.single('audio'), async (req, res) => {
  const file = req.file
  const user = req.user

  if (!file) {
    return res.status(400).json({ error: 'File audio wajib diupload' })
  }

  try {
    // Kirim ke AI service
    const formData = new FormData()
    formData.append('file', fs.createReadStream(file.path), {
      filename: file.filename,
      contentType: file.mimetype
    })

    const aiResponse = await axios.post(
      `${process.env.AI_SERVICE_URL}/analyze`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000
      }
    )

    const result = aiResponse.data

    // Simpan ke Supabase evaluations
    const { data, error } = await supabaseAdmin
      .from('evaluations')
      .insert({
        user_id: user.id,
        audio_path: file.filename,
        score: result.score ?? null,
        fluency: result.fluency ?? null,
        clarity: result.clarity ?? null,
        confidence: result.confidence ?? null,
        feedback: result.feedback ?? null
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return res.status(500).json({ error: 'Gagal menyimpan hasil ke database' })
    }

    return res.json({
      message: 'Analisis berhasil',
      evaluation_id: data.id,
      audio_file: file.filename,
      analysis: result
    })
  } catch (err) {
    console.error('Error saat memproses analisis:', err.message)
    return res.status(500).json({
      error: 'Gagal menganalisis audio',
      detail: err.response?.data || err.message
    })
  }
})

// GET /api/evaluations (riwayat user login)
router.get('/', supabaseAuthRequired, async (req, res) => {
  const user = req.user

  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .select('id, score, fluency, clarity, confidence, feedback, audio_path, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase select error:', error)
    return res.status(500).json({ error: 'Gagal mengambil data' })
  }

  return res.json(data)
})

// GET /api/evaluations/:id (detail milik user)
router.get('/:id', supabaseAuthRequired, async (req, res) => {
  const user = req.user
  const { id } = req.params

  const { data, error } = await supabaseAdmin
    .from('evaluations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    return res.status(404).json({ error: 'Data tidak ditemukan' })
  }
  if (error) {
    console.error('Supabase select error:', error)
    return res.status(500).json({ error: 'Gagal mengambil data' })
  }

  return res.json(data)
})

export default router
