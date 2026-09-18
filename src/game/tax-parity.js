export const TAX_RATE_MIN=0
export const TAX_RATE_MAX=99

export function isTaxRate(value) {
  return Number.isInteger(value)&&value>=TAX_RATE_MIN&&value<=TAX_RATE_MAX
}

export function clampTaxRate(value) {
  const numeric=Number.isFinite(Number(value))?Math.round(Number(value)):TAX_RATE_MIN
  return Math.max(TAX_RATE_MIN,Math.min(TAX_RATE_MAX,numeric))
}

export function adjustTaxRate(value,delta) {
  return clampTaxRate(clampTaxRate(value)+delta)
}
