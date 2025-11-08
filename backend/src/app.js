import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes/index.js'
import pool from './config/db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api', routes)

app.get('/', (req, res) => {
  res.json({ message: 'Express backend OK' })
})

try {
  const conn = await pool.getConnection()
  console.log('Database connected!')
  conn.release()
} catch (err) {
  console.error('Database connection failed:', err)
}

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
