export const OFFICER_STATUS_FIELDS = Object.freeze([
  Object.freeze({ id:'level', label:'等級' }),
  Object.freeze({ id:'rank', label:'官位' }),
  Object.freeze({ id:'civilExperience', label:'文官值' }),
  Object.freeze({ id:'militaryExperience', label:'武官值' }),
  Object.freeze({ id:'stamina', label:'體力' }),
  Object.freeze({ id:'force', label:'武力' }),
  Object.freeze({ id:'intelligence', label:'知力' }),
  Object.freeze({ id:'virtue', label:'德' }),
  Object.freeze({ id:'loyalty', label:'忠誠度' }),
  Object.freeze({ id:'command', label:'統率力' }),
  Object.freeze({ id:'mobility', label:'機動力' }),
  Object.freeze({ id:'troops', label:'兵力' }),
  Object.freeze({ id:'morale', label:'士氣' }),
  Object.freeze({ id:'attack', label:'攻擊力' }),
  Object.freeze({ id:'weapon', label:'武器' }),
])

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

// The Japanese retail manual documents the complete status-field vocabulary and
// ordering. Chinese-ROM per-officer values have not yet been transcribed, so the
// projection exposes the verified schema while deliberately leaving every value
// empty instead of borrowing numbers from history books or another game.
export function officerStatusProjection(row) {
  if (!row) return null
  const status = Object.fromEntries(OFFICER_STATUS_FIELDS.map((field)=>[field.id,null]))
  return Object.freeze({
    name:row.name,
    role:row.role,
    ...status,
    evidence:'name-role-only; status-schema-jp-manual',
  })
}
