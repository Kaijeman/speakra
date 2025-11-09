import { Router } from 'express'
import evaluationsRouter from './evaluations.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

router.use('/evaluations', evaluationsRouter)

export default router
