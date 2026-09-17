import { dailyFoodFor } from './march.js'

export const MAX_FOOD_DAYS = 999

export function foodForDays(troops, officerCount, days) {
  const safeDays = Math.max(0, Math.min(MAX_FOOD_DAYS, Math.floor(days)))
  return dailyFoodFor(troops, officerCount) * safeDays
}

export function maxFoodDaysForStock(troops, officerCount, foodStock) {
  const daily = Math.max(1, dailyFoodFor(troops, officerCount))
  return Math.max(0, Math.min(MAX_FOOD_DAYS, Math.floor(Math.max(0, foodStock) / daily)))
}

export function shouldBlockTitleNavigation({ hasGame, fromStrategy, force = false }) {
  return Boolean(hasGame && fromStrategy && !force)
}
