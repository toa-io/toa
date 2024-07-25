import { now } from './now'

const time = new Date().getTime()

it('should return current ms', () => {
  const ms = Number.parseInt(now(undefined))

  expect(ms).toBeGreaterThanOrEqual(time)
})

it('should add shift', () => {
  const ms = Number.parseInt(now(undefined, '1000'))

  expect(ms).toBeGreaterThanOrEqual(time + 1000)
})

it('should parse seconds', () => {
  const ms = Number.parseInt(now(undefined, '1s'))

  expect(ms).toBeGreaterThanOrEqual(time + 1000)
})
