import express from 'express'
import multer from 'multer'
import { supabaseAuthRequired } from '../middleware/authSupabase.js'
import { analyzeEvaluation, listEvaluations } from '../controllers/evaluationsController.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith('audio/')) cb(null, true)
    else cb(new Error('Tipe file tidak didukung'))
  }
})

router.post('/evaluations', supabaseAuthRequired, upload.single('audio'), analyzeEvaluation)

router.get('/evaluations', supabaseAuthRequired, listEvaluations)

export default router
