export function now (_: unknown, shift = '0'): string {
  const match = SHIFT_RX.exec(shift) as Match | null

  if (match === null)
    throw new Error(`Invalid shift: ${shift}`)

  const s = parse(match.groups.value, match.groups.unit)

  return (Date.now() + s).toString()
}

function parse (value: string, unit?: string): number {
  const number = Number.parseFloat(value)
  const multiplier = unit === undefined ? 1 : multipliers[unit]

  if (multiplier === undefined)
    throw new Error(`Invalid unit: ${unit}`)

  return number * multiplier
}

interface Match {
  groups: {
    value: string
    unit?: string
  }
}

const multipliers: Record<string, number> = {
  ms: 1,
  s: 1000,
  sec: 1000,
  m: 60000,
  min: 60000,
  h: 3600000,
  hr: 3600000,
  hour: 3600000,
  hours: 3600000,
  d: 86400000,
  day: 86400000,
  days: 86400000
}

const SHIFT_RX = /^(?<value>-?\d+(?:\.\d)?)(?<unit>\w{1,3})?$/
