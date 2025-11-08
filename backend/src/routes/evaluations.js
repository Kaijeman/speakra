import { Router } from 'express'
import upload from '../middleware/upload.js'
import pool from '../config/db.js'
import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'

const router = Router()

// POST /api/evaluations
// Body: form-data (fields: user_id optional, file: audio)
router.post('/', upload.single('audio'), async (req, res) => {
  const file = req.file
  const { user_id } = req.body

  if (!file) {
    return res.status(400).json({ error: 'File audio wajib diupload' })
  }

  try {
    // Siapkan form-data untuk dikirim ke AI service
    const formData = new FormData()
    formData.append('file', fs.createReadStream(file.path), {
      filename: file.filename,
      contentType: file.mimetype
    })

    // Panggil AI service
    const aiResponse = await axios.post(
      `${process.env.AI_SERVICE_URL}/analyze`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 60000
      }
    )

    const result = aiResponse.data

    // Simpan ke database
    const [insert] = await pool.query(
      `INSERT INTO evaluations 
        (user_id, audio_path, score, fluency, clarity, confidence, feedback)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        file.filename,
        result.score || null,
        result.fluency || null,
        result.clarity || null,
        result.confidence || null,
        result.feedback || null
      ]
    )

    return res.json({
      message: 'Analisis berhasil',
      evaluation_id: insert.insertId,
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

// GET /api/evaluations/:id
// Ambil detail hasil analisis
router.get('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.query(
      `SELECT e.*, u.name AS user_name, u.email AS user_email
       FROM evaluations e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Data tidak ditemukan' })
    }

    return res.json(rows[0])
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
