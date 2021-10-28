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
    const entity = { observation: async (input, entity) => Object.assign(entity, input) }
    const set = { observation: async (input, set) => Object.assign(set, input) }

    expect(definition(entity)).toMatchObject({ subject: 'entity' })
    expect(definition(set)).toMatchObject({ subject: 'set' })
  })
})
