import OpenAI from 'openai'

let _groq: OpenAI | null = null

export function getGroqClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set. Add it to .env.local and restart the server.')
  }

  if (!_groq) {
    _groq = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  }

  return _groq
}

export const DEFAULT_MODEL = 'llama-3.3-70b-versatile'
