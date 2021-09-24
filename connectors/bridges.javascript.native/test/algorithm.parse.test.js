'use strict'

const { parse } = require('../src/define/algorithm')

describe('type', () => {
  it('should provide type', () => {
    async function observation () {}

    async function transition () {}

    const o = parse(observation)
    const t = parse(transition)

    expect(o.type).toBe('observation')
    expect(t.type).toBe('transition')
  })

  it('should throw if algorithm is not named function declaration', () => {
    const observation = () => {}

    expect(() => parse(observation)).toThrow(/must export named function declaration/)
  })

  it('should throw if algorithm is not async function', () => {
    function observation () {}

    expect(() => parse(observation)).toThrow(/must export async function/)
  })
})

describe('target', () => {
  it('should provide target', () => {
    async function observation (input, entry) {}

    async function transition (input, set) {}

    const o = parse(observation)
    const d = parse(transition)

    expect(o.target).toBe('entry')
    expect(d.target).toBe('set')
  })
})
