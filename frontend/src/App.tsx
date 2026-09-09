import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, ChevronRight, CircleHelp, RefreshCw, X } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Results } from './components/Results'
import { History } from './components/History'
import { Guide } from './components/Guide'
import { useHistory } from './hooks/useHistory'
import { api } from './lib/api'
import { validateText } from './lib/format'
import type { Analysis, Example, View } from './lib/types'
const Compare = lazy(() => import('./components/Compare'))
const headings = {
  workspace: ['Un espacio para tus palabras.', 'Escribe. Explora. Encuentra una nueva perspectiva.'],
  compare: ['Misma idea. Nuevas posibilidades.', 'Pon dos textos lado a lado y descubre qué cambia.'],
  history: ['Vuelve a tus palabras.', 'Tus análisis recientes, a un paso de distancia.'],
  guide: ['Entender antes de interpretar.', 'Una guía honesta de lo que tus métricas pueden contarte.'],
}
function App() {
  const [view, setView] = useState<View>('workspace')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [resultTitle, setResultTitle] = useState('')
  const [undo, setUndo] = useState<{ text: string; title: string } | null>(null)
  const [result, setResult] = useState<Analysis | null>(null)
  const [examples, setExamples] = useState<Example[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [notice, setNotice] = useState('')
  const [compareVisited, setCompareVisited] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const notify = useCallback((message: string) => setNotice(message), [])
  const history = useHistory(notify)
  const stale = !!result && result.original_text !== text
  useEffect(() => {
    let alive = true
    async function connect() {
      try { await api.health(); if (alive) setConnected(true) } catch { if (alive) setConnected(false) }
    }
    void connect()
    void api.examples().then(data => { if (alive) setExamples(data) }).catch(() => {})
    const interval = window.setInterval(connect, 30_000)
    return () => { alive = false; window.clearInterval(interval) }
  }, [])
  useEffect(() => { if (!notice) return; const id = window.setTimeout(() => setNotice(''), 5000); return () => window.clearTimeout(id) }, [notice])
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => { if (text && !history.entries.some(entry => entry.text === text)) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', prevent)
    return () => window.removeEventListener('beforeunload', prevent)
  }, [text, history.entries])
  function navigate(next: View) { setView(next); if (next === 'compare') setCompareVisited(true); requestAnimationFrame(() => heading.current?.focus()) }
  function replace(next: string, name = '') { setUndo({ text, title }); setText(next); setTitle(name); setError(null) }
  function openText(next: string, name = '') { replace(next, name); navigate('workspace'); notify('Texto abierto. Pulsa Analizar texto para obtener sus métricas.') }
  async function analyze() {
    if (busy || validateText(text)) return
    if (result && !stale) { notify('Los resultados ya corresponden a este texto.'); return }
    setBusy(true); setError(null)
    try {
      const data = await api.analyze(text)
      setResult(data); setResultTitle(title); setConnected(true); history.save(data, title)
      notify('Análisis completado. Los resultados están disponibles después del editor.')
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo analizar el texto.'); void api.health().then(() => setConnected(true)).catch(() => setConnected(false)) }
    finally { setBusy(false) }
  }
  async function reconnect() {
    setConnected(null)
    try { await api.health(); setConnected(true); setExamples(await api.examples()); notify('Conexión restablecida.') }
    catch { setConnected(false); notify('La API sigue sin estar disponible.') }
  }
  return <div className="app-shell"><a href="#main-content" className="skip-link">Saltar al contenido</a><Sidebar view={view} onNavigate={navigate} count={history.entries.length} connected={connected} />
    <div className="main-shell"><header className="topbar"><div><span>Workspace</span><ChevronRight size={13} /><strong>{view === 'workspace' ? 'Análisis de texto' : view === 'compare' ? 'Comparación' : view === 'history' ? 'Historial' : 'Guía'}</strong></div><div><span className="personal-space">Espacio personal</span><span className="avatar" aria-label="Espacio personal de usuario">TÚ</span></div></header>
    <main id="main-content"><div className="page-heading"><div><span className="eyebrow heading-kicker">{view === 'workspace' ? 'MENOS RUIDO. MÁS SIGNIFICADO.' : 'CADA PALABRA CUENTA.'}</span><h1 ref={heading} tabIndex={-1}>{headings[view][0]}</h1><p>{headings[view][1]}</p></div><button className="help-button" onClick={() => navigate(view === 'guide' ? 'workspace' : 'guide')}><CircleHelp size={16} />{view === 'guide' ? 'Volver al editor' : 'Cómo funciona'}<ArrowUpRight size={13} /></button></div>
    {connected === false && <div className="offline-banner" role="status"><span>No hay conexión con la API. Puedes seguir escribiendo.</span><button className="text-button" onClick={reconnect}><RefreshCw size={14} />Reconectar</button></div>}
    <div hidden={view !== 'workspace'}><div className="workspace-heading"><div><span className="section-index">01</span><h2>Tu documento</h2></div><span className="live-indicator"><span />Análisis bajo demanda</span></div><div className="workspace-grid"><Editor text={text} title={title} onText={setText} onTitle={setTitle} onAnalyze={analyze} onClear={() => replace('')} onUndo={() => { if (undo) { setText(undo.text); setTitle(undo.title); setUndo(null) } }} canUndo={!!undo} onExample={example => replace(example.text, example.title)} examples={examples} busy={busy} error={error} /><Results result={result} busy={busy} stale={stale} title={resultTitle} notify={notify} /></div><div className="workspace-bottom"><span><Check size={13} />Tu texto se procesa sin guardarse en el servidor.</span><button className="text-button" onClick={() => navigate('history')}>{history.enabled ? 'Historial local activado' : 'Historial local desactivado'}<ArrowUpRight size={13} /></button></div></div>
    {compareVisited && <div hidden={view !== 'compare'}><Suspense fallback={<p className="muted">Preparando comparación…</p>}><Compare original={text} onOpen={value => openText(value, 'Versión B')} /></Suspense></div>}
    {view === 'history' && <History {...history} onOpen={entry => openText(entry.text, entry.title)} />}
    {view === 'guide' && <Guide />}
    <footer className="page-footer"><span>LÉXICO <span className="footer-slash">/</span> HAZ QUE CADA PALABRA CUENTE.</span><span>Hecho con intención.</span></footer>
    </main></div><div className={`toast ${notice ? 'visible' : ''}`} role="status" aria-live="polite">{notice && <><Check size={16} /><span>{notice}</span><button className="icon-button" aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={15} /></button></>}</div>
  </div>
}
export default App
