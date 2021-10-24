'use strict'

const { definition } = require('../src/define/operations/definition')

it('should throw if algorithm is not async function', () => {
  const module = { observation: () => null }
  expect(() => definition(module)).toThrow(/must export async function/)
})

describe('type', () => {
  it('should return type', () => {
    async function observe () {}

    const observation = { observation: observe }
    const transition = { transition: async () => null }

    const o = definition(observation)
    const t = definition(transition)

    expect(o.type).toBe('observation')
    expect(t.type).toBe('transition')
  })

  it('should throw on incorrect export', () => {
    expect(() => definition({ _: async () => null }))
      .toThrow(/transition, observation or assignment/)

    expect(() => definition({ observation: 1 })).toThrow(/function/)
  })
})

describe('subject', () => {
  it('should return subject', () => {
    const entry = { observation: async (input, entry) => Object.assign(entry, input) }
    const item = { observation: async (input, item) => Object.assign(item, input) }
    const entries = { observation: async (input, entries) => Object.assign(entries, input) }
    const items = { observation: async (input, items) => Object.assign(items, input) }
    const set = { observation: async (input, set) => Object.assign(set, input) }

    expect(definition(entry)).toMatchObject({ subject: 'entry' })
    expect(definition(item)).toMatchObject({ subject: 'entry' })
    expect(definition(entries)).toMatchObject({ subject: 'entries' })
    expect(definition(items)).toMatchObject({ subject: 'entries' })
    expect(definition(set)).toMatchObject({ subject: 'entries' })
  })

  it('should not return unknown subject', () => {
    const result = definition({ transition: async (input, message) => Object.assign(message, input) })
    expect(result.subject).toBe(undefined)
  })
})
