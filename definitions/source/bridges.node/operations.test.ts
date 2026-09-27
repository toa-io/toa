import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { exports } from './exports.ts'
import { algorithm } from './operations.ts'

const define = (text: string): ReturnType<typeof algorithm> =>
  algorithm(exports('module.js', text), 'module.js')

it('returns null where no function is exported', () => {
  assert.equal(define('export const foo = "bar"'), null)
})

it('refuses a function that does not match conventions', () => {
  assert.throws(() => define('export const append = () => null'), /does not match conventions/)
})

it('refuses a class that does not match conventions', () => {
  assert.throws(() => define('export class Foo {}'), /does not match conventions/)
})

it('refuses two algorithms', () => {
  assert.throws(
    () => define('export function transition() {}\nexport function observation() {}'),
    /exports 'transition', 'observation'/
  )
})

describe('function', () => {
  const cases: Array<[string, object]> = [
    ['function transition(input, entry) {}', { type: 'transition', scope: 'entry' }],
    ['function observation(input, entry) {}', { type: 'observation', scope: 'entry' }],
    ['function assignment(input, changeset) {}', { type: 'assignment', scope: 'changeset' }],
    ['function computation(input, context) {}', { type: 'computation', scope: 'none' }],
    ['function effect(input, context) {}', { type: 'effect', scope: 'none' }],
    ['const observation = (input, entries) => null', { type: 'observation', scope: 'entries' }],
    ['const effect = (_, stream) => stream', { type: 'effect', scope: 'stream' }]
  ]

  for (const [source, expected] of cases)
    it(`defines '${source}'`, () => {
      assert.deepStrictEqual(define('export ' + source), expected)
    })

  it('does not define an unknown scope', () => {
    assert.equal(define('export const assignment = (input, message) => null')?.scope, undefined)
  })

  it('defines null input', () => {
    assert.deepStrictEqual(define('export const observation = () => null'), {
      type: 'observation',
      scope: 'none',
      input: null
    })
  })

  it('defines a default export by its declared name', () => {
    assert.deepStrictEqual(define('export default function transition(input, entry) {}'), {
      type: 'transition',
      scope: 'entry'
    })
  })

  it('defines an alias by the exported name', () => {
    assert.deepStrictEqual(define('const meter = (input) => 1\nexport { meter as computation }'), {
      type: 'computation',
      scope: 'none'
    })
  })

  it('leaves the scope of a computed export to the manifest', () => {
    assert.deepStrictEqual(define('export const transition = wrap(fn)'), { type: 'transition' })
  })

  it('ignores an export that is neither a function nor named as an algorithm', () => {
    assert.deepStrictEqual(define('export const NAME = "x"\nexport function effect() {}'), {
      type: 'effect',
      scope: 'none',
      input: null
    })
  })
})

describe('class', () => {
  it('defines type and scope by the execute method', () => {
    assert.deepStrictEqual(define('export class Transition { execute(input, entry) {} }'), {
      type: 'transition',
      scope: 'entry'
    })
  })

  it('finds execute among other methods', () => {
    assert.deepStrictEqual(
      define('export class Assignment { execute(input, entry) {}\n run(input, entries) {} }'),
      { type: 'assignment', scope: 'entry' }
    )
  })

  it('refuses a class without execute', () => {
    assert.throws(() => define('export class Observation {}'), /Method 'execute' not found/)
  })

  it('refuses a function named as a class', () => {
    assert.throws(() => define('export function Transition() {}'), /does not match conventions/)
  })

  it('defines none scope and null input', () => {
    assert.deepStrictEqual(define('export class Observation { execute() {} }'), {
      type: 'observation',
      scope: 'none',
      input: null
    })
  })

  it('defines Computation and Effect', () => {
    assert.equal(define('export class Computation { execute() {} }')?.type, 'computation')
    assert.equal(define('export class Effect { execute() {} }')?.type, 'effect')
  })
})

describe('factory', () => {
  it('defines type and scope by the name', () => {
    assert.deepStrictEqual(define('export class EntryTransitionFactory { create() {} }'), {
      type: 'transition',
      scope: 'entry'
    })
  })

  it('refuses a scope outside the convention', () => {
    assert.throws(
      () => define('export class NoneObservationFactory { create() {} }'),
      /does not match conventions/
    )
  })

  it('defines ComputationFactory and EffectFactory', () => {
    assert.deepStrictEqual(define('export class ComputationFactory {}'), { type: 'computation' })
    assert.deepStrictEqual(define('export class EffectFactory {}'), { type: 'effect' })
  })
})
