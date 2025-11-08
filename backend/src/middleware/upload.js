import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = path.join(process.cwd(), 'uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `speakra-${unique}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3', 'audio/ogg']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Format audio tidak didukung'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
})

export default upload
