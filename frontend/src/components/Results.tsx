import { ArrowUpRight, AudioLines, Check, Clock3, Copy, Download, Fingerprint, Lightbulb, ScanText } from 'lucide-react'
import { useState } from 'react'
import type { Analysis } from '../lib/types'
import { duration, number, report } from '../lib/format'

export function Results({ result, busy, stale, title, notify }: { result: Analysis | null; busy: boolean; stale: boolean; title: string; notify: (message: string) => void }) {
  const [tab, setTab] = useState<'overview' | 'words' | 'structure'>('overview')
  const [copied, setCopied] = useState(false)
  async function copy() {
    if (!result) return
    try { await navigator.clipboard.writeText(report(result, title)); setCopied(true); window.setTimeout(() => setCopied(false), 2000); notify('Informe copiado al portapapeles.') }
    catch { notify('No se pudo copiar. Puedes descargar el informe como archivo de texto.') }
  }
  function download() {
    if (!result) return
    const url = URL.createObjectURL(new Blob([report(result, title)], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'lexico-analisis.txt'; link.click(); URL.revokeObjectURL(url)
    notify('Informe descargado.')
  }
  if (busy) return <section className="results-panel" aria-label="Analizando texto" aria-busy="true"><div className="results-heading"><h2>Una nueva perspectiva</h2><span className="eyebrow">ANALIZANDO</span></div><div className="loading-state"><ScanText size={35} /><p>Estamos leyendo entre tus líneas…</p><div className="skeleton" /><div className="skeleton" /><div className="skeleton short" /></div></section>
  if (!result) return <section className="results-panel empty-results"><div className="results-heading"><h2>Una nueva perspectiva</h2><span className="tiny-dot" /></div><div className="empty-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-document"><span /><span /><span /><span /><span /></div><span className="art-badge"><ScanText size={23} /></span><span className="art-cross">+</span></div><h3>Tu texto tiene mucho que contar.</h3><p>Descubre su ritmo, las palabras que lo definen<br className="desktop-break" /> y el tono que transmite.</p><div className="empty-features"><span><AudioLines size={16} />Estructura y ritmo</span><span><Fingerprint size={16} />Vocabulario</span><span><Lightbulb size={16} />Tono e ideas</span></div><div className="empty-bottom">Escribe algo y pulsa <strong>Analizar texto <ArrowUpRight size={12} /></strong></div></section>
  return <section className="results-panel populated" aria-label="Resultados del análisis">
    <div className="results-heading"><h2>Tu texto, en perspectiva</h2><span className="analysis-badge"><Check size={12} />Analizado</span></div>
    {stale && <div className="stale-notice" role="status">El texto cambió. Analiza de nuevo para actualizar estos resultados.</div>}
    <div className="result-tabs" role="tablist" aria-label="Detalle del análisis">{(['overview', 'words', 'structure'] as const).map((id, index) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls="result-tabpanel" tabIndex={tab === id ? 0 : -1} onKeyDown={e => {
      const ids = ['overview', 'words', 'structure'] as const
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const next = ids[(index + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; setTab(next); document.getElementById(`tab-${next}`)?.focus() }
    }} onClick={() => setTab(id)}>{id === 'overview' ? 'Vista general' : id === 'words' ? 'Vocabulario' : 'Estructura'}</button>)}</div>
    <div id="result-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0} className="result-content" key={tab}>
      {tab === 'overview' && <>
        <div className="metric-grid"><Metric label="Palabras" value={number(result.word_count)} /><Metric label="Caracteres" value={number(result.character_count)} /><Metric label="Oraciones" value={number(result.sentence_count)} /><Metric label="Párrafos" value={number(result.paragraph_count)} /></div>
        <div className="reading-row"><span><Clock3 size={15} />Lectura <strong>{duration(result.reading_seconds)}</strong></span><span><AudioLines size={15} />En voz alta <strong>{duration(result.speaking_seconds)}</strong></span></div>
        <Tone result={result} />
        <div className="vocabulary-summary"><div><h3>Una voz propia</h3><p>{number(result.unique_word_count)} palabras únicas de {number(result.word_count)}</p></div><span className="lexical-value">{number(result.lexical_diversity)}<small>%</small></span><div className="vocabulary-track"><span style={{ width: `${result.lexical_diversity}%` }} /></div><small>Diversidad léxica · Depende de la extensión del texto.</small></div>
        <div className="insight-box"><Lightbulb size={18} /><div><h3>Una idea para tu próxima revisión</h3><p>{result.insights[0]}</p></div></div>
      </>}
      {tab === 'words' && <><div className="section-intro"><span className="eyebrow">LAS PALABRAS QUE DESTACAN</span><h3>El vocabulario de tu texto</h3><p>Frecuencia de palabras, sin artículos ni conectores comunes en español e inglés.</p></div><div className="word-chart">{result.frequent_words.map((item, index) => <div className="word-row" key={item.word}><span className="word-rank">0{index + 1}</span><strong>{item.word}</strong><div className="word-track"><span style={{ width: `${item.count / result.frequent_words[0].count * 100}%` }} /></div><span>{item.count}</span></div>)}{!result.frequent_words.length && <p className="muted">Solo encontramos números o palabras comunes excluidas de esta lista.</p>}</div><div className="detail-pair"><Metric value={number(result.unique_word_count)} label="Palabras únicas" /><Metric value={number(result.average_word_length)} label="Caracteres por palabra" /></div><p className="method-note">Se agrupan mayúsculas y minúsculas, pero no sinónimos ni formas conjugadas.</p></>}
      {tab === 'structure' && <><div className="section-intro"><span className="eyebrow">ENCUENTRA TU RITMO</span><h3>Una oración, una idea</h3><p>{number(result.words_per_sentence)} palabras por oración en promedio.</p></div><div className="sentence-chart" role="img" aria-label={`Longitud de las primeras ${Math.min(result.sentences.length, 60)} oraciones. ${result.long_sentence_count} oraciones superan las 25 palabras.`}>{result.sentences.slice(0, 60).map(s => <div key={s.index} className={s.words > 25 ? 'long' : ''} style={{ height: `${Math.max(4, s.words / Math.max(...result.sentences.slice(0, 60).map(v => v.words), 25) * 100)}%` }} title={`Oración ${s.index}: ${s.words} palabras`} />)}</div><div className="chart-caption"><span>Oraciones en orden →</span><span><i /> Más de 25 palabras</span></div><details className="sentence-details"><summary>Ver datos de todas las oraciones</summary><ol>{result.sentences.map(s => <li key={s.index}>Oración {s.index}: {s.words} palabras</li>)}</ol></details><div className="detail-pair"><Metric value={number(result.question_count)} label="Preguntas" /><Metric value={number(result.exclamation_count)} label="Exclamaciones" /></div><p className="method-note">{number(result.characters_without_spaces)} caracteres sin espacios. Los saltos de línea en blanco separan párrafos.</p><div className="insight-box"><Lightbulb size={18} /><p>{result.insights[0]}</p></div></>}
    </div>
    <div className="result-footer"><span>Calculado con Léxico</span><div><button className="text-button" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copiado' : 'Copiar'}</button><button className="icon-button" aria-label="Descargar informe" title="Descargar informe" onClick={download}><Download size={15} /></button></div></div>
  </section>
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div> }
function Tone({ result }: { result: Analysis }) {
  const { sentiment } = result
  return <div className="tone-section"><div className="section-line"><h3>Tono del texto</h3><span className={`tone-label ${sentiment.label}`}>{sentiment.label}</span></div><div className="tone-track"><span style={{ left: `${(sentiment.score + 1) * 50}%` }} /></div><div className="tone-axis"><span>Negativo</span><span>Neutral</span><span>Positivo</span></div><details><summary>Estimación, no veredicto <span>· {sentiment.matched_words} señales</span></summary><p>{sentiment.explanation}</p><p>Score: {sentiment.score} en una escala de −1 a +1. Cobertura léxica: {sentiment.coverage}%. No es una probabilidad.</p></details></div>
}
