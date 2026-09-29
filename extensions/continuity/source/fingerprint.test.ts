import { it } from 'node:test'
import assert from 'node:assert/strict'
import { fingerprint } from './fingerprint.ts'

it('should be the same for the same ask whatever order its keys were written in', () => {
  assert.equal(
    fingerprint([{ a: 1, b: { c: 2, d: 3 } }]),
    fingerprint([{ b: { d: 3, c: 2 }, a: 1 }])
  )
})

it('should tell apart what differs by type alone', () => {
  assert.notEqual(fingerprint([1]), fingerprint(['1']))
  assert.notEqual(fingerprint([null]), fingerprint(['null']))
})

it('should read an absent key and an undefined one as one ask', () => {
  assert.equal(fingerprint([{ a: 1 }]), fingerprint([{ a: 1, b: undefined }]))
})

it('should tell apart what differs in an array', () => {
  assert.notEqual(fingerprint([[1, 2]]), fingerprint([[2, 1]]))
})

it('should digest bytes by what they hold', () => {
  assert.equal(fingerprint([Buffer.from('a')]), fingerprint([Buffer.from('a')]))
  assert.notEqual(fingerprint([Buffer.from('a')]), fingerprint([Buffer.from('b')]))
})

it('should tell a signal by its kind alone', () => {
  assert.equal(
    fingerprint([{ signal: new AbortController().signal }]),
    fingerprint([{ signal: new AbortController().signal }])
  )
})

it('should digest what refers to itself', () => {
  const value: Record<string, unknown> = { a: 1 }

  value.self = value

  assert.equal(typeof fingerprint([value]), 'string')
})
