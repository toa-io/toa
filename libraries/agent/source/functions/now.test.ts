import { it } from 'node:test'
import assert from 'node:assert/strict'

import { now } from './now.js'

const time = new Date().getTime()

it('should return current ms', () => {
  const ms = Number.parseInt(now(undefined))

  assert.ok(ms >= time)
})

it('should add shift', () => {
  const ms = Number.parseInt(now(undefined, '1000'))

  assert.ok(ms >= time + 1000)
})

it('should parse +', () => {
  const ms = Number.parseInt(now(undefined, '+1000'))

  assert.ok(ms >= time + 1000)
})

it('should parse seconds', () => {
  const ms = Number.parseInt(now(undefined, '1s'))

  assert.ok(ms >= time + 1000)
})

it('should parse hours', () => {
  const ms = Number.parseInt(now(undefined, '2hours'))

  assert.ok(ms >= time + 7200000)
})
