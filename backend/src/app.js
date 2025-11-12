import express from 'express'
import cors from 'cors'
import evaluationsRouter from './routes/evaluations.js'

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

app.use(express.json())

app.get('/api/ping', (req, res) => res.json({ ok: true }))

app.use('/api', evaluationsRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Backend on http://localhost:${PORT}`))
