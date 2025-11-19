import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(apiKey)

export function getGeminiModel() {
  const modelName = process.env.GEMINI_MODEL_NAME
  return genAI.getGenerativeModel({ model: modelName })
}
