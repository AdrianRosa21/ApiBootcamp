import type { Analysis, Comparison, Example } from './types'
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')
export const MAX_LENGTH = 50_000

async function request<T>(path: string, body?: object): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 15_000)
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    if (!response.ok) {
      if (response.status === 422) throw new Error('Revisa el texto: debe contener palabras y no superar 50.000 caracteres.')
      if (response.status === 413) throw new Error('El texto supera el tamaño permitido.')
      throw new Error('La API no pudo completar la solicitud. Vuelve a intentarlo.')
    }
    return await response.json() as T
  } catch (error) {
    if (error instanceof TypeError || (error instanceof Error && error.name === 'AbortError')) {
      throw new Error('No pudimos conectar con la API. Tu texto sigue aquí; revisa la conexión e inténtalo de nuevo.')
    }
    throw error
  } finally { window.clearTimeout(timeout) }
}
export const api = {
  analyze: (text: string) => request<Analysis>('/analyze', { text }),
  compare: (text_a: string, text_b: string) => request<Comparison>('/compare', { text_a, text_b }),
  examples: () => request<Example[]>('/examples'),
  health: () => request<{ status: string }>('/health'),
}
