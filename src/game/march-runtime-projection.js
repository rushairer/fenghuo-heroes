export const MARCH_RUNTIME_PROJECTION=Object.freeze({
  routeStepWorld:8,
  routeNodeDays:1,
  executionDaysPerEvenMonth:30,
  enemyArmyAdjacencyWorld:8,
  enemyCityAdjacencyWorld:24,
  evidence:Object.freeze({
    routeStepWorld:'provisional-engineering',
    routeNodeDays:'provisional-engineering',
    executionDaysPerEvenMonth:'provisional-calendar-baseline',
    enemyArmyAdjacencyWorld:'provisional-engineering',
    enemyCityAdjacencyWorld:'provisional-engineering',
  }),
})

export function marchProjectionReport(){
  return Object.freeze({
    routeStepWorld:MARCH_RUNTIME_PROJECTION.routeStepWorld,
    routeNodeDays:MARCH_RUNTIME_PROJECTION.routeNodeDays,
    executionDaysPerEvenMonth:MARCH_RUNTIME_PROJECTION.executionDaysPerEvenMonth,
    enemyArmyAdjacencyWorld:MARCH_RUNTIME_PROJECTION.enemyArmyAdjacencyWorld,
    enemyCityAdjacencyWorld:MARCH_RUNTIME_PROJECTION.enemyCityAdjacencyWorld,
    evidence:MARCH_RUNTIME_PROJECTION.evidence,
  })
}
