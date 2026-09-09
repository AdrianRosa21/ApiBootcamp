import { useState } from 'react'
import { addHistory, CONSENT_KEY, HISTORY_KEY, readHistory } from '../lib/history'
import type { Analysis, HistoryEntry } from '../lib/types'
export function useHistory(notify: (message: string) => void) {
  const [entries, setEntries] = useState(() => readHistory(localStorage))
  const [enabled, setEnabled] = useState(() => { try { return localStorage.getItem(CONSENT_KEY) === 'true' } catch { return false } })
  function persist(next: HistoryEntry[]) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); setEntries(next) }
    catch { notify('No se pudo guardar el historial. El almacenamiento puede estar lleno o bloqueado.') }
  }
  function toggle() {
    try { localStorage.setItem(CONSENT_KEY, String(!enabled)); setEnabled(!enabled) }
    catch { notify('Este navegador no permite guardar la preferencia de historial.') }
  }
  return { entries, enabled, toggle, save: (result: Analysis, title: string) => {
    if (enabled) persist(addHistory(readHistory(localStorage), result, title))
  }, remove: (id: string) => persist(entries.filter(e => e.id !== id)), clear: () => persist([]) }
}
