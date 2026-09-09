import { ArrowRight, GitCompareArrows, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { api } from '../lib/api'
import { duration, number, validateText } from '../lib/format'
import type { Comparison } from '../lib/types'
export default function Compare({ original, onOpen }: { original: string; onOpen: (text: string) => void }) {
  const [a, setA] = useState(original)
  const [b, setB] = useState('')
  const [result, setResult] = useState<Comparison | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stale = result && (result.a.original_text !== a || result.b.original_text !== b)
  async function compare() {
    setBusy(true); setError(null)
    try { setResult(await api.compare(a, b)) }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron comparar los textos.') }
    finally { setBusy(false) }
  }
  const rows = result ? [
    ['Palabras', number(result.a.word_count), number(result.b.word_count)],
    ['Caracteres', number(result.a.character_count), number(result.b.character_count)],
    ['Oraciones', number(result.a.sentence_count), number(result.b.sentence_count)],
    ['Palabras por oración', number(result.a.words_per_sentence), number(result.b.words_per_sentence)],
    ['Diversidad léxica', `${number(result.a.lexical_diversity)}%`, `${number(result.b.lexical_diversity)}%`],
    ['Lectura estimada', duration(result.a.reading_seconds), duration(result.b.reading_seconds)],
    ['Tono estimado', result.a.sentiment_hint, result.b.sentiment_hint],
  ] : []
  return <div className="compare-page"><div className="comparison-editors">{([{ key: 'a', label: 'Texto A', text: a, set: setA }, { key: 'b', label: 'Texto B', text: b, set: setB }]).map(item => <section className="compare-editor" key={item.key}><label htmlFor={`compare-${item.key}`}><span className={`letter-badge ${item.key}`}>{item.key.toUpperCase()}</span>{item.label}<small>{item.key === 'a' ? 'Punto de partida' : 'Una nueva versión'}</small></label><textarea id={`compare-${item.key}`} value={item.text} onChange={e => item.set(e.target.value)} placeholder={item.key === 'a' ? 'Pega la primera versión de tu texto…' : '¿Cómo suena tu idea de otra manera?'} aria-describedby={`hint-${item.key}`} /><div id={`hint-${item.key}`} className="compare-hint">{item.text && validateText(item.text) || 'Máximo 50.000 caracteres'}</div></section>)}</div><div className="compare-actions"><p>Dos versiones. Una mirada más clara.</p><button className="primary-button" disabled={busy || !!validateText(a) || !!validateText(b)} onClick={compare}>{busy ? <LoaderCircle className="spin" size={16} /> : <GitCompareArrows size={16} />}{busy ? 'Comparando…' : 'Comparar textos'}</button></div>{error && <p className="error-banner" role="alert">{error}</p>}
    {result ? <section className="comparison-results" aria-label="Resultado de comparación"><div className="section-line"><h2>El cambio, en palabras.</h2><span className="eyebrow">B RESPECTO A A</span></div>{stale && <p className="stale-notice" role="status">Los textos cambiaron. Vuelve a comparar para actualizar.</p>}<div className="compare-highlights"><div><strong>{result.word_delta > 0 ? '+' : ''}{number(result.word_delta)}</strong><span>palabras de diferencia</span></div><div><strong>{result.sentence_length_delta > 0 ? '+' : ''}{number(result.sentence_length_delta)}</strong><span>palabras por oración</span></div><div><strong>{number(result.vocabulary_overlap)}<small>%</small></strong><span>coincidencia de vocabulario</span></div></div><table><caption className="sr-only">Métricas de ambas versiones</caption><thead><tr><th scope="col">Indicador</th><th scope="col">Texto A</th><th scope="col">Texto B</th></tr></thead><tbody>{rows.map(row => <tr key={row[0]}><th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table><div className="compare-bottom"><p>{result.shared_word_count} palabras únicas compartidas. Coincidencia = intersección / unión de vocabularios. Más corto no siempre significa mejor.</p><button className="text-button" onClick={() => onOpen(result.b.original_text)}>Abrir B en el editor<ArrowRight size={14} /></button></div></section> : <div className="compare-empty"><GitCompareArrows size={28} /><h3>Encuentra lo que cambia.</h3><p>Compara extensión, ritmo, vocabulario y tono.<br />Elige la versión que mejor cuenta tu idea.</p></div>}
  </div>
}
