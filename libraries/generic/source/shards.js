import { range } from './range.js'

export const shards = (input) => {
  const match = input.match(RANGE)

  if (match === null) return [input]

  const numbers = range(match.groups.range)

  return numbers.map((number) => input.replace(RANGE, String(number)))
}

const RANGE = /{(?<range>[0-9]{1,8}-[0-9]{1,8})}/
