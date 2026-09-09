import type { Analysis } from './types'
export const number = (value: number) => new Intl.NumberFormat('es-SV', { maximumFractionDigits: 1 }).format(value)
export const characterCount = (text: string) => Array.from(text).length
export const liveWords = (text: string) => (text.normalize('NFC').match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []).length
export const duration = (seconds: number) => seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min${seconds % 60 ? ` ${seconds % 60} s` : ''}`
export function validateText(text: string): string | null {
  if (characterCount(text) > 50_000) return 'El límite es de 50.000 caracteres. Reduce el texto para continuar.'
  if (!/[\p{L}\p{N}]/u.test(text)) return 'Escribe al menos una palabra para empezar.'
  return null
}
export function report(result: Analysis, title: string): string {
  return [`LÉXICO · ${title || 'Texto sin título'}`, '',
    `Palabras: ${result.word_count}`, `Caracteres: ${result.character_count}`,
    `Oraciones: ${result.sentence_count}`, `Párrafos: ${result.paragraph_count}`,
    `Palabras por oración: ${result.words_per_sentence}`, `Diversidad léxica: ${result.lexical_diversity}%`,
    `Lectura estimada: ${duration(result.reading_seconds)}`, `Tono estimado: ${result.sentiment_hint} (${result.sentiment.score})`,
    '', ...result.insights, '', result.sentiment.explanation, `Motor: ${result.analyzer_version}`].join('\n')
}

