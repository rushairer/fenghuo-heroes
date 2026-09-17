export function openingOfficerRows(store, factionId = store?.humanFaction) {
  const roster = store?.state?.openingRosters?.[factionId]
  if (!roster) return []

  const rows = []
  const seen = new Set()
  const push = (name, role) => {
    const normalized = String(name ?? '').trim()
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    rows.push(Object.freeze({ name:normalized, role }))
  }

  push(roster.ruler, '君主')
  for (const name of roster.officers ?? []) push(name, '武將')
  return rows
}
