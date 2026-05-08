// Vereinheitlicht den Zugriff auf die Ziele einer Aufgabe.
// Eine Aufgabe kann nur Seiten, nur Minuten oder beides haben.
// Liefert ein Array { type, target } in stabiler Reihenfolge: pages vor minutes.
export function getTaskOptions(task) {
  if (!task) return []
  const opts = []
  const pages = numOrNull(task.target_pages)
  const minutes = numOrNull(task.target_minutes)
  if (pages != null) opts.push({ type: 'pages', target: pages })
  if (minutes != null) opts.push({ type: 'minutes', target: minutes })
  if (opts.length === 0) {
    // Fallback für Altdaten ohne Migration
    const legacy = numOrNull(task.target_value)
    if (legacy != null && (task.type === 'pages' || task.type === 'minutes')) {
      opts.push({ type: task.type, target: legacy })
    }
  }
  return opts
}

export function isDualType(task) {
  return getTaskOptions(task).length === 2
}

export function getTargetForType(task, type) {
  return getTaskOptions(task).find(o => o.type === type)?.target ?? null
}

// Welcher Eintragstyp ist für ein Log relevant? Falls log.type fehlt
// (Altdaten), nimm task.type bzw. den ersten verfügbaren Typ als Fallback.
export function resolveLogType(task, log) {
  if (log?.type === 'pages' || log?.type === 'minutes') return log.type
  if (task?.type === 'pages' || task?.type === 'minutes') return task.type
  return getTaskOptions(task)[0]?.type ?? null
}

function numOrNull(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
