export type View = 'workspace' | 'compare' | 'history' | 'guide'
export interface Analysis {
  original_text: string
  character_count: number
  word_count: number
  sentence_count: number
  has_question: boolean
  sentiment_hint: string
  characters_without_spaces: number
  paragraph_count: number
  question_count: number
  exclamation_count: number
  average_word_length: number
  words_per_sentence: number
  unique_word_count: number
  lexical_diversity: number
  reading_seconds: number
  speaking_seconds: number
  frequent_words: { word: string; count: number }[]
  sentences: { index: number; words: number }[]
  long_sentence_count: number
  sentiment: { label: 'positivo' | 'negativo' | 'neutral'; score: number; matched_words: number; coverage: number; method: string; explanation: string }
  insights: string[]
  analyzer_version: string
}
export interface Comparison {
  a: Analysis
  b: Analysis
  word_delta: number
  sentence_length_delta: number
  vocabulary_overlap: number
  shared_word_count: number
}
export interface Example { id: string; title: string; category: string; description: string; text: string }
export interface HistoryEntry { id: string; title: string; date: string; text: string; wordCount: number; tone: string }
