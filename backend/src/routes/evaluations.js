import express from 'express'
import multer from 'multer'
import axios from 'axios'
import FormData from 'form-data'
import { fileURLToPath } from 'url'
import { join, extname } from 'path'
import fs from 'fs/promises'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { supabaseAuthRequired } from '../middleware/authSupabase.js'

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

router.post('/evaluations', supabaseAuthRequired, upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'File audio tidak ditemukan' })
      }

      const { originalname, mimetype, size, buffer } = req.file
      console.log('[UPLOAD]', { originalname, mimetype, size })

      const wavBuffer = await convertToWav(buffer, mimetype)

      const form = new FormData()
      form.append('file', wavBuffer, { filename: 'upload.wav', contentType: 'audio/wav' })

      const aiBase = process.env.AI_BASE_URL || 'http://localhost:8000'
      const aiResp = await axios.post(`${aiBase}/analyze`, form, {
        headers: form.getHeaders(),
        timeout: 60_000
      })

      return res.json(aiResp.data)
    } catch (err) {
      console.error('[EVALUATIONS_ERROR]', err?.response?.data || err.message)
      return res.status(500).json({
        error: 'Gagal menganalisis audio',
        detail: err?.response?.data || err.message
      })
    }
  }
)

export default router
