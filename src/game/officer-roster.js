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

// The original manual confirms that country status can drill into that country's
// officer list. We do not yet have evidence-backed per-city officer placement,
// so this projection deliberately exposes only the owning faction's documented
// opening roster and marks city assignment as unverified.
export function openingOfficerListForCity(store, cityId) {
  const factionId = store?.state?.cities?.[cityId]?.owner ?? null
  const rows = factionId && factionId !== 'neutral' ? openingOfficerRows(store, factionId) : []
  return Object.freeze({
    cityId:cityId ?? null,
    factionId,
    rows:Object.freeze([...rows]),
    cityAssignmentVerified:false,
    evidence:rows.length ? 'opening-faction-roster' : 'unverified',
  })
}

// Until the Chinese-ROM character table is transcribed field by field, never
// fill status attributes from history books or another Three Kingdoms game.
export function officerStatusProjection(row) {
  if (!row) return null
  return Object.freeze({
    name:row.name,
    role:row.role,
    level:null,
    force:null,
    intelligence:null,
    virtue:null,
    loyalty:null,
    evidence:'name-role-only',
  })
}
