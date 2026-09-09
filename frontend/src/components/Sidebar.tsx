import { BookOpen, ChartNoAxesCombined, ChevronRight, GitCompareArrows, History, PenLine, ShieldCheck } from 'lucide-react'
import type { View } from '../lib/types'
const links = [
  { id: 'workspace', label: 'Analizar texto', icon: PenLine },
  { id: 'compare', label: 'Comparar textos', icon: GitCompareArrows },
  { id: 'history', label: 'Historial', icon: History },
  { id: 'guide', label: 'Guía de análisis', icon: BookOpen },
] as const
export function Sidebar({ view, onNavigate, count, connected }: { view: View; onNavigate: (view: View) => void; count: number; connected: boolean | null }) {
  return <aside className="sidebar">
    <a className="brand" href="#workspace" onClick={e => { e.preventDefault(); onNavigate('workspace') }} aria-label="Léxico, ir al editor"><span className="brand-symbol">L<span>′</span></span><span>léxico<span className="brand-period">.</span></span></a>
    <div className="space-label">TU ESPACIO DE PALABRAS</div>
    <nav aria-label="Navegación principal">{links.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} aria-current={view === id ? 'page' : undefined} onClick={() => onNavigate(id)}><Icon size={18} /><span>{label}</span>{id === 'history' && count > 0 ? <span className="count-badge">{count}</span> : view === id ? <ChevronRight size={14} className="nav-arrow" /> : null}</button>)}</nav>
    <div className="sidebar-bottom"><div className="privacy-note"><ShieldCheck size={20} /><strong>Tus palabras, tu espacio.</strong><p>Sin cuentas. Sin textos guardados en el servidor.</p></div>
      <div className="sidebar-foot"><span className={`connection-dot ${connected === false ? 'offline' : connected === null ? 'pending' : ''}`} /><span>{connected === null ? 'Conectando…' : connected ? 'API conectada' : 'API desconectada'}</span><span className="version">v2.0</span></div>
      <div className="built-with"><ChartNoAxesCombined size={12} /> Del bootcamp al producto.</div>
    </div>
  </aside>
}
