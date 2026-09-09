import { ArrowRight, FileText, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react'
import type { Example } from '../lib/types'
import { characterCount, liveWords, number, validateText } from '../lib/format'
export function Editor({ text, title, onText, onTitle, onAnalyze, onClear, onUndo, canUndo, onExample, examples, busy, error }: {
  text: string; title: string; onText: (text: string) => void; onTitle: (title: string) => void;
  onAnalyze: () => void; onClear: () => void; onUndo: () => void; canUndo: boolean;
  onExample: (example: Example) => void; examples: Example[]; busy: boolean; error: string | null
}) {
  const invalid = validateText(text)
  const tooLong = characterCount(text) > 50_000
  return <section className="editor-panel" aria-label="Editor de texto">
    <div className="panel-toolbar"><span><FileText size={15} /> DOCUMENTO</span><div><span className="language-tag">ES / EN</span>{canUndo && <button className="text-button" onClick={onUndo}><RotateCcw size={14} />Deshacer</button>}<button className="text-button" disabled={!text || busy} onClick={onClear}>Limpiar</button></div></div>
    <div className="editor-body"><label className="sr-only" htmlFor="document-title">Título del documento</label><input id="document-title" className="document-title" value={title} maxLength={100} onChange={e => onTitle(e.target.value)} placeholder="Texto sin título" />
      <label className="sr-only" htmlFor="text-editor">Texto para analizar</label><textarea id="text-editor" value={text} onChange={e => onText(e.target.value)} placeholder={'Las grandes ideas empiezan con unas palabras.\n\nEscribe o pega tu texto aquí. Nosotros te ayudamos a mirarlo más de cerca.'} aria-describedby="editor-limit" aria-invalid={tooLong || undefined} spellCheck onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (!invalid && !busy) onAnalyze() } }} />
      {!text && <div className="editor-starter"><span className="starter-mark"><Sparkles size={17} /></span><div><strong>¿Una página en blanco?</strong><p>Empieza con uno de nuestros textos de ejemplo.</p></div></div>}
    </div>
    <div className="editor-counts" id="editor-limit"><span><b>{number(liveWords(text))}</b> palabras <span className="separator">/</span> <span className={tooLong ? 'danger-text' : ''}>{number(characterCount(text))}</span> caracteres</span><span>Máx. 50.000</span></div>
    <div className="editor-action"><span className="shortcut"><kbd>Ctrl</kbd> + <kbd>↵</kbd><span> para analizar</span></span><button className="primary-button" onClick={onAnalyze} disabled={!!invalid || busy}>{busy ? <><LoaderCircle size={17} className="spin" />Analizando…</> : <>Analizar texto<ArrowRight size={17} /></>}</button></div>
    {(error || (text && invalid)) && <p className="inline-error" role="alert">{error || invalid}</p>}
    <div className="examples"><span className="eyebrow">PRUEBA CON UN EJEMPLO</span><div className="example-list">{examples.map((example, index) => <button key={example.id} disabled={busy} onClick={() => onExample(example)}><span className={`example-number n${index}`}>0{index + 1}</span><span><strong>{example.category}</strong><small>{example.title}</small></span><ArrowRight size={14} /></button>)}{!examples.length && <p className="muted small">Los ejemplos aparecerán al conectar con la API.</p>}</div></div>
  </section>
}
