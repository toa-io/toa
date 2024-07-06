export function toBytes (input: string): number {
  const match = RX.exec(input)

  if (match === null)
    throw new TypeError(`Invalid bytes format: ${input}`)

  const value = parseFloat(match.groups!.value)
  const prefix = match.groups!.prefix?.[0].toLowerCase() ?? ''
  const binary = match.groups!.binary !== undefined || match.groups!.unit === 'b'
  const base = binary ? 1024 : 1000
  const power = POWERS.indexOf(prefix)

  return value * Math.pow(base, power)
}

const POWERS = ['', 'k', 'm', 'g', 't']
const RX = /^(?<value>(\d+)(\.\d+)?)(?<prefix>[kmgt](?<binary>i)?)?(?<unit>b)?$/i
