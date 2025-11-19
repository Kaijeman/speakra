import express from 'express'
import multer from 'multer'
import fs from 'fs/promises'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { supabaseAuthRequired } from '../middleware/authSupabase.js'
import { supabaseAdmin } from '../lib/supabaseClient.js'
import { getGeminiModel } from '../lib/geminiClient.js'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith('audio/')) cb(null, true)
    else cb(new Error('Tipe file tidak didukung'))
  }
})

async function bufferToTempFile(buffer, ext = '.bin') {
  const { file } = await import('tmp-promise')
  const tmp = await file({ postfix: ext })
  await fs.writeFile(tmp.path, buffer)
  return { path: tmp.path, cleanup: tmp.cleanup }
}

async function convertToWav(buffer, mime) {
  const inExt = mime?.includes('webm') ? '.webm'
              : mime?.includes('ogg')  ? '.ogg'
              : mime?.includes('mpeg') ? '.mp3'
              : mime?.includes('wav')  ? '.wav'
              : '.bin'

  const { path: inPath, cleanup: cleanIn } = await bufferToTempFile(buffer, inExt)
  const { file } = await import('tmp-promise')
  const outTmp = await file({ postfix: '.wav' })

  await new Promise((resolve, reject) => {
    ffmpeg(inPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('error', reject)
      .on('end', resolve)
      .save(outTmp.path)
  })

  const outBuf = await fs.readFile(outTmp.path)
  await fs.unlink(outTmp.path).catch(() => {})
  await cleanIn().catch(() => {})
  return outBuf
}

function cleanGeminiJson(text) {
  if (!text) return text
  return text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
}

router.post('/evaluations', supabaseAuthRequired, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File audio tidak ditemukan' })
    }

    const { originalname, mimetype, size, buffer } = req.file
    console.log('[UPLOAD]', { originalname, mimetype, size })

    const wavBuffer = await convertToWav(buffer, mimetype)

    const model = getGeminiModel()
    const audioBase64 = wavBuffer.toString('base64')

    const prompt = `
Kamu adalah sistem penilai kualitas public speaking berbahasa Indonesia.

Tugasmu:
1. TRANSKRIPSI singkat isi pidato dari audio.
2. NILAI kualitas public speaking berdasarkan:
   - kelancaran (fluency)
   - kejelasan pelafalan (clarity)
   - kecepatan bicara (speed)
   - kualitas isi dan struktur (content)

PENTING:
- Jika audio hanya berisi kata-kata pendek yang berulang (misalnya "tes tes tes" atau yang serupa) 
  atau tidak membentuk kalimat yang jelas, beri nilai RENDAH (overall_score maksimal 30).
- Jika durasi sangat singkat (< 10 detik) atau jumlah kata sangat sedikit (< 10 kata),
  anggap sebagai percobaan mikrofon dan beri nilai RENDAH.
- Semakin terstruktur, runtut, dan relevan isi pidatonya, semakin tinggi nilainya.
- Semakin sering jeda "eee", "emm", pengulangan tidak perlu, atau pelafalan kurang jelas,
  turunkan nilai fluency dan clarity.

KIRIMKAN HASIL DALAM BENTUK JSON MURNI (TANPA blok kode, TANPA tanda \`\`\`), dengan format:

{
  "transcript": string, // ringkasan transkripsi bahasa Indonesia
  "overall_score": number, // 0 - 100
  "fluency": number, // 0 - 1
  "clarity": number, // 0 - 1
  "speed": number, // 0 - 1
  "content_score": number, // 0 - 1, kualitas isi & struktur
  "estimated_duration": number, // perkiraan durasi dalam detik
  "word_count": number, // jumlah kata kira-kira
  "is_valid_speech": boolean, // false jika hanya tes mic / kata acak / sangat pendek
  "feedback": string // feedback singkat dalam bahasa Indonesia
}

Hanya kirim JSON valid, tanpa teks lain sebelum atau sesudahnya.
    `.trim()

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'audio/wav',
                data: audioBase64,
              },
            },
          ],
        },
      ],
    })

    const rawText = result.response.text().trim()
    const cleanedText = cleanGeminiJson(rawText)

    let analysis
    try {
      analysis = JSON.parse(cleanedText)
    } catch (err) {
      console.error('[GEMINI_PARSE_ERROR] Raw response:', rawText)
      throw new Error('Gagal membaca hasil')
    }

    const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0))
    const clampScore100 = (v) => Math.max(0, Math.min(100, Number(v) || 0))

    const isValidSpeech = analysis.is_valid_speech !== false
    const wordCount = Number(analysis.word_count || 0)
    const duration = Number(analysis.estimated_duration || 0)
    const contentScore = clamp01(analysis.content_score)

    let score = clampScore100(analysis.overall_score)
    let fluency = clamp01(analysis.fluency)
    let clarity = clamp01(analysis.clarity)
    let speed = clamp01(analysis.speed)
    let feedback = analysis.feedback || 'Tidak ada umpan balik.'

    let penaltyReason = ''

    if (!isValidSpeech || wordCount < 10 || duration < 10 || contentScore < 0.3) {
      score = 0
      fluency = 0
      clarity = 0
      speed = 0
    }

    analysis = {
      score,
      fluency,
      clarity,
      speed,
      feedback,
    }

    try {
      const userId = req.user?.id
      if (!userId) {
        console.error('[SUPABASE_INSERT_ERROR] userId kosong')
      } else {
        const audioPath = req.file?.originalname || 'recording'

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
      }
    } catch (err) {
      console.error('[SUPABASE_INSERT_EXCEPTION]', err)
    }

    return res.json({ analysis })
  } catch (err) {
    console.error('[EVALUATIONS_ERROR]', err?.response?.data || err.message)
    return res.status(500).json({
      error: 'Gagal menganalisis audio',
      detail: err?.response?.data || err.message
    })
  }
})

router.get('/evaluations', supabaseAuthRequired, async (req, res) => {
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
})

export default router