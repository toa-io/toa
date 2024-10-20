import assert from 'node:assert'

export function now (_: unknown, shift = '0'): string {
  const match = SHIFT_RX.exec(shift) as Match | null

  assert.ok(match !== null, `Invalid shift: ${shift}`)

  const ms = parse(match.groups.value, match.groups.unit)

  return (Date.now() + ms).toString()
}

function parse (value: string, unit?: string): number {
  const number = Number.parseFloat(value)
  const multiplier = unit === undefined ? 1 : multipliers[unit]

  assert.ok(!Number.isNaN(number), `Invalid number: ${value}`)
  assert.ok(multiplier !== undefined, `Invalid unit: ${unit}`)

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

const SHIFT_RX = /^(?<value>-?\d+(?:\.\d)?)(?<unit>\w{1,16})?$/
