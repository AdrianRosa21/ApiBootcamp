import type { Analysis, HistoryEntry } from './types'
export const HISTORY_KEY = 'lexico.history.v1'
export const CONSENT_KEY = 'lexico.history.enabled'
export const LIMIT = 20
export function readHistory(storage: Pick<Storage, 'getItem'>): HistoryEntry[] {
  try {
    const raw: unknown = JSON.parse(storage.getItem(HISTORY_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter((item): item is HistoryEntry => !!item && typeof item === 'object'
      && typeof item.id === 'string' && typeof item.title === 'string' && item.title.length <= 100
      && typeof item.text === 'string' && item.text.length <= 50_000
      && typeof item.date === 'string' && !Number.isNaN(Date.parse(item.date))
      && typeof item.wordCount === 'number' && typeof item.tone === 'string').slice(0, LIMIT)
  } catch { return [] }
}
export function addHistory(entries: HistoryEntry[], result: Analysis, title: string): HistoryEntry[] {
  return [{ id: crypto.randomUUID(), title: title.trim().slice(0, 100) || 'Texto sin título',
    date: new Date().toISOString(), text: result.original_text, wordCount: result.word_count, tone: result.sentiment_hint },
    ...entries.filter(e => e.text !== result.original_text)].slice(0, LIMIT)
}
