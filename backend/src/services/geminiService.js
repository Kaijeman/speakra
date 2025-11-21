import { getGeminiModel } from '../lib/geminiClient.js'

function cleanGeminiJson(text) {
  if (!text) return text
  return text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
}

export async function analyzeWithGemini(wavBuffer) {
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

  let analysisRaw
  try {
    analysisRaw = JSON.parse(cleanedText)
  } catch (err) {
    console.error('[GEMINI_PARSE_ERROR] Raw response:', rawText)
    throw new Error('Gagal membaca hasil')
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0))
  const clampScore100 = (v) => Math.max(0, Math.min(100, Number(v) || 0))

  const isValidSpeech = analysisRaw.is_valid_speech !== false
  const wordCount = Number(analysisRaw.word_count || 0)
  const duration = Number(analysisRaw.estimated_duration || 0)
  const contentScore = clamp01(analysisRaw.content_score)

  let score = clampScore100(analysisRaw.overall_score)
  let fluency = clamp01(analysisRaw.fluency)
  let clarity = clamp01(analysisRaw.clarity)
  let speed = clamp01(analysisRaw.speed)
  let feedback = analysisRaw.feedback || 'Tidak ada umpan balik.'

  if (!isValidSpeech || wordCount < 10 || duration < 10 || contentScore < 0.3) {
    score = 0
    fluency = 0
    clarity = 0
    speed = 0
  }

  return {
    score,
    fluency,
    clarity,
    speed,
    feedback,
  }
}
