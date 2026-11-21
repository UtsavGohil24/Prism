// Single source of truth for the selectable analysis models.
// `key` must match the backend's AnalysisRequest.model: "gemini" | "nemotron" | "glm".
// Groq is never listed here: it's only the automatic fallback.

export const DEFAULT_MODEL = 'gemini'

export const MODELS = [
  {
    key: 'gemini',
    label: 'Gemini',
    full: 'Gemini 2.5 Flash',
    tagline: 'Fastest and most consistent',
    note: 'Recommended',
    icon: 'bolt',
    slow: false,
  },
  {
    key: 'nemotron',
    label: 'Nemotron',
    full: 'NVIDIA Nemotron',
    tagline: 'Free tier, reasoning model',
    note: 'Slower, can take up to a minute',
    icon: 'psychology',
    slow: true,
  },
  {
    key: 'glm',
    label: 'GLM',
    full: 'GLM',
    tagline: 'Free tier alternative',
    note: 'Slower, can take up to a minute',
    icon: 'neurology',
    slow: true,
  },
]

export function getModel(key) {
  return MODELS.find(m => m.key === key) || MODELS[0]
}

// True when the report was answered by the Groq fallback instead of the
// model the user picked. Backend format: "<groq model> (fallback from <model>)".
export function isFallback(modelUsed) {
  return (modelUsed || '').toLowerCase().includes('fallback')
}

// Maps the backend's `model_used` string back to a model key.
// Fallback reports map to the model that was REQUESTED.
// Missing values (rows from before multi-model support) were all Gemini.
export function modelKeyOf(modelUsed) {
  const m = (modelUsed || '').toLowerCase()
  if (!m) return 'gemini'
  const fb = m.match(/fallback from (.+?)\)?$/)
  const origin = fb ? fb[1] : m
  if (origin.includes('nemotron')) return 'nemotron'
  if (origin.includes('glm')) return 'glm'
  return 'gemini'
}
