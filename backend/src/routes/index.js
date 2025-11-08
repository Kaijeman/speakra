import { Router } from 'express'
import pool from '../config/db.js'
import evaluationsRouter from './evaluations.js'

const router = Router()

router.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message })
  }
})

// Prefix untuk fitur evaluasi
router.use('/evaluations', evaluationsRouter)

export default router
