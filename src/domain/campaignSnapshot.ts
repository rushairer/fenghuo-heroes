export type SnapshotFactionId = 'cao' | 'liu' | 'sun' | 'yuan' | 'dong' | 'neutral'

export type StartableFactionId = Exclude<SnapshotFactionId, 'neutral'>

export type SnapshotCityId = string
export type SnapshotOfficerId = string
export type SnapshotArmyId = string

export type SnapshotOfficerStatus = 'normal' | 'wounded' | 'captured'

export type SnapshotMarchArmyStatus = 'ready' | 'marching' | 'besieging' | 'retreating' | 'routed'

export type CampaignSnapshotMeta = {
  schemaVersion: 1
  savedAt: string
  year: number
  month: number
  difficulty: 'easy' | 'normal' | 'hard'
  playerFactionId: StartableFactionId
}

export type SerializableCity = {
  id: SnapshotCityId
  owner: SnapshotFactionId
  gold: number
  food: number
  troops: number
  defense: number
  population?: number
  commerce?: number
  land?: number
  irrigation?: number
  disaster?: number
}

export type SerializableOfficer = {
  id: SnapshotOfficerId
  faction: SnapshotFactionId
  location: SnapshotCityId
  loyalty: number
  troops?: number
  weapons?: number
  spear?: number
  bow?: number
  horse?: number
  armor?: number
  training?: number
  status?: SnapshotOfficerStatus
  statusTurns?: number
  captorFactionId?: SnapshotFactionId
  merit?: number
  salary?: number
  fatigue?: number
}

export type SerializableMarchArmy = {
  id: SnapshotArmyId
  factionId: SnapshotFactionId
  sourceCityId: SnapshotCityId
  targetCityId?: SnapshotCityId
  leaderOfficerId: SnapshotOfficerId
  officerIds: SnapshotOfficerId[]
  officerTroops: Record<SnapshotOfficerId, number>
  officerFood: Record<SnapshotOfficerId, number>
  officerFatigue: Record<SnapshotOfficerId, number>
  troops: number
  food: number
  morale: number
  position: {
    kind: 'city' | 'route'
    cityId?: SnapshotCityId
    route?: [SnapshotCityId, SnapshotCityId]
    progress?: number
  }
  routePlan: SnapshotCityId[]
  movePoints: number
  status: SnapshotMarchArmyStatus
}

export type SerializableDiplomacyDebt = {
  factionId: SnapshotFactionId
  principal: number
  dueYear: number
  dueMonth: number
}

export type CampaignSnapshot = {
  meta: CampaignSnapshotMeta
  cities: SerializableCity[]
  officers: SerializableOfficer[]
  marchArmies: SerializableMarchArmy[]
  defeatedFactionIds: SnapshotFactionId[]
  alliances: Partial<Record<StartableFactionId, StartableFactionId[]>>
  debts: SerializableDiplomacyDebt[]
}

export type UnificationProgress = {
  ownedCities: number
  totalCities: number
  percentage: number
  victory: boolean
}

export type CampaignSnapshotInput = Omit<CampaignSnapshot, 'meta'> & {
  meta: Omit<CampaignSnapshotMeta, 'schemaVersion' | 'savedAt'> & {
    savedAt?: string
  }
}

export const CAMPAIGN_SNAPSHOT_SCHEMA_VERSION = 1

export function createCampaignSnapshot(input: CampaignSnapshotInput): CampaignSnapshot {
  return {
    meta: {
      ...input.meta,
      schemaVersion: CAMPAIGN_SNAPSHOT_SCHEMA_VERSION,
      savedAt: input.meta.savedAt ?? new Date().toISOString(),
    },
    cities: input.cities.map((city) => ({ ...city })),
    officers: input.officers.map((officer) => ({ ...officer })),
    marchArmies: input.marchArmies.map((army) => ({
      ...army,
      officerIds: [...army.officerIds],
      officerTroops: { ...army.officerTroops },
      officerFood: { ...army.officerFood },
      officerFatigue: { ...army.officerFatigue },
      position: {
        ...army.position,
        route: army.position.route ? [...army.position.route] : undefined,
      },
      routePlan: [...army.routePlan],
    })),
    defeatedFactionIds: [...input.defeatedFactionIds],
    alliances: cloneAlliances(input.alliances),
    debts: input.debts.map((debt) => ({ ...debt })),
  }
}

export function getControlledCityIds(snapshot: CampaignSnapshot, factionId: SnapshotFactionId): SnapshotCityId[] {
  return snapshot.cities.filter((city) => city.owner === factionId).map((city) => city.id)
}

export function getLivingFactionIds(snapshot: CampaignSnapshot): StartableFactionId[] {
  const defeated = new Set(snapshot.defeatedFactionIds)
  return (['cao', 'liu', 'sun', 'yuan', 'dong'] as StartableFactionId[]).filter((factionId) => !defeated.has(factionId))
}

export function isFactionDefeated(snapshot: CampaignSnapshot, factionId: StartableFactionId): boolean {
  return snapshot.defeatedFactionIds.includes(factionId) || getControlledCityIds(snapshot, factionId).length === 0
}

export function getUnificationProgress(snapshot: CampaignSnapshot, factionId: SnapshotFactionId): UnificationProgress {
  const totalCities = snapshot.cities.length
  const ownedCities = getControlledCityIds(snapshot, factionId).length
  return {
    ownedCities,
    totalCities,
    percentage: totalCities === 0 ? 0 : Math.round((ownedCities / totalCities) * 100),
    victory: totalCities > 0 && ownedCities === totalCities,
  }
}

export function getArmyLoad(snapshot: CampaignSnapshot, armyId: SnapshotArmyId): { troops: number; food: number; fatigue: number } | undefined {
  const army = snapshot.marchArmies.find((candidate) => candidate.id === armyId)
  if (!army) return undefined

  return {
    troops: sumRecord(army.officerTroops),
    food: sumRecord(army.officerFood),
    fatigue: sumRecord(army.officerFatigue),
  }
}

export function validateCampaignSnapshot(snapshot: CampaignSnapshot): string[] {
  const errors: string[] = []
  const cityIds = new Set(snapshot.cities.map((city) => city.id))
  const officerIds = new Set(snapshot.officers.map((officer) => officer.id))

  if (snapshot.meta.schemaVersion !== CAMPAIGN_SNAPSHOT_SCHEMA_VERSION) {
    errors.push(`unsupported schema version: ${snapshot.meta.schemaVersion}`)
  }

  if (!cityIds.has(snapshot.cities.find((city) => city.owner === snapshot.meta.playerFactionId)?.id ?? '')) {
    errors.push(`player faction has no controlled city: ${snapshot.meta.playerFactionId}`)
  }

  for (const officer of snapshot.officers) {
    if (!cityIds.has(officer.location)) {
      errors.push(`officer ${officer.id} references missing city ${officer.location}`)
    }
  }

  for (const army of snapshot.marchArmies) {
    if (!cityIds.has(army.sourceCityId)) {
      errors.push(`army ${army.id} references missing source city ${army.sourceCityId}`)
    }

    if (army.targetCityId && !cityIds.has(army.targetCityId)) {
      errors.push(`army ${army.id} references missing target city ${army.targetCityId}`)
    }

    if (!officerIds.has(army.leaderOfficerId)) {
      errors.push(`army ${army.id} references missing leader ${army.leaderOfficerId}`)
    }

    for (const officerId of army.officerIds) {
      if (!officerIds.has(officerId)) {
        errors.push(`army ${army.id} references missing officer ${officerId}`)
      }
    }
  }

  return errors
}

function cloneAlliances(alliances: Partial<Record<StartableFactionId, StartableFactionId[]>>): Partial<Record<StartableFactionId, StartableFactionId[]>> {
  return Object.fromEntries(
    Object.entries(alliances).map(([factionId, allies]) => [factionId, [...allies]]),
  ) as Partial<Record<StartableFactionId, StartableFactionId[]>>
}

function sumRecord(record: Record<string, number>): number {
  return Object.values(record).reduce((total, value) => total + value, 0)
}
