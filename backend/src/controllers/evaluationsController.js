import { supabaseAdmin } from '../lib/supabaseClient.js'
import { convertToWav } from '../services/audioService.js'
import { analyzeWithGemini } from '../services/geminiService.js'

export async function analyzeEvaluation(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File audio tidak ditemukan' })
    }

    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User tidak ditemukan' })
    }

    const { originalname, mimetype, size, buffer } = req.file
    console.log('[UPLOAD]', { originalname, mimetype, size })

    const wavBuffer = await convertToWav(buffer, mimetype)
    const analysis = await analyzeWithGemini(wavBuffer)

    try {
      const audioPath = originalname || 'recording'

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('evaluations')
        .insert({
          user_id: userId,
          audio_path: audioPath,
          score: analysis.score ?? null,
          fluency: analysis.fluency ?? null,
          clarity: analysis.clarity ?? null,
          speed: analysis.speed ?? null,
          feedback: analysis.feedback ?? null,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[SUPABASE_INSERT_ERROR]', insertError)
      } else {
        console.log('[SUPABASE_INSERT_OK]', inserted.id)
      }
    } catch (err) {
      console.error('[SUPABASE_INSERT_EXCEPTION]', err)
    }

    return res.json({ analysis })
  } catch (err) {
    console.error('[EVALUATIONS_ERROR]', err?.response?.data || err.message)
    return res.status(500).json({
      error: 'Gagal menganalisis audio',
      detail: err?.response?.data || err.message,
    })
  }
}

export async function listEvaluations(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User tidak ditemukan' })
    }

    const page = Number.parseInt(req.query.page) || 1
    const limit = Math.min(Number.parseInt(req.query.limit) || 10, 50)
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabaseAdmin
      .from('evaluations')
      .select(
        'id, audio_path, score, fluency, clarity, speed, feedback, created_at',
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('[EVALUATIONS_LIST_ERROR]', error)
      return res.status(500).json({ error: 'Gagal mengambil riwayat' })
    }

    return res.json({
      items: data || [],
      page,
      limit,
      total: count ?? (data ? data.length : 0),
    })
  } catch (err) {
    console.error('[EVALUATIONS_LIST_EXCEPTION]', err)
    return res.status(500).json({ error: 'Gagal mengambil riwayat' })
  }
}
