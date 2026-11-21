
// Single source of truth for selectable analysis models.
// Keys must match the backend AnalysisRequest.model:
// "gemini" | "cohere" | "llama".
// Groq is never selectable. It is only the automatic fallback.

export const DEFAULT_MODEL = 'gemini'

export const MODELS = [
  {
    key: 'gemini',
    label: 'Gemini',
    full: 'Gemini 2.5 Flash',
    tagline: 'Google AI model',
    note: 'Default model',
    icon: 'bolt',
    slow: false,
  },
  {
    key: 'cohere',
    label: 'Cohere',
    full: 'Cohere Command A+',
    tagline: 'Cohere AI model',
    note: 'Alternative model',
    icon: 'psychology',
    slow: false,
  },
  {
    key: 'llama',
    label: 'Llama',
    full: 'Llama 3.3 70B',
    tagline: 'Powered by Cloudflare Workers AI',
    note: 'Alternative model',
    icon: 'neurology',
    slow: false,
  },
]

export function getModel(key) {
  return MODELS.find(m => m.key === key) || MODELS[0]
}

// True when Groq answered instead of the selected primary model.
export function isFallback(modelUsed) {
  return (modelUsed || '').toLowerCase().includes('fallback')
}

// Maps the backend model_used string to its original requested model.
// Fallback reports map to the model that was originally selected.
export function modelKeyOf(modelUsed) {
  const value = (modelUsed || '').toLowerCase()

  if (!value) return DEFAULT_MODEL

  const fallbackIndex = value.indexOf('fallback from ')
  const origin = fallbackIndex >= 0
    ? value.slice(fallbackIndex + 'fallback from '.length)
    : value

  if (origin.includes('cohere')) return 'cohere'
  if (origin.includes('llama') || origin.includes('cloudflare')) return 'llama'
  if (origin.includes('gemini')) return 'gemini'

  return DEFAULT_MODEL
}
