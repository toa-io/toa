import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'
import { DirectivesFactory } from './Directive.js'
import type { syntax, DirectiveFamily } from './RTD/index.js'
import type { Remotes } from './Remotes.js'
import type { Context } from './HTTP/index.js'

const sequence: string[] = []

const families: Array<DirectiveFamily> = [
  {
    name: 'foo',
    mandatory: true,
    create: mock.fn((_0: any, _1: any, _2: any) => generate() as any),
    arrange: mock.fn(),
    preflight: mock.fn(() => { sequence.push('foo'); return null }),
    settle: mock.fn(),
    dispose: mock.fn()
  },
  {
    name: 'qux',
    mandatory: true,
    create: mock.fn((_0: any, _1: any, _2: any) => generate() as any),
    arrange: mock.fn(),
    preflight: mock.fn(() => { sequence.push('qux'); return null }),
    settle: mock.fn(),
    dispose: mock.fn()
  },
  {
    name: 'bar',
    mandatory: false,
    create: mock.fn((_0: string, _1: any, _2: any) => generate() as any),
    arrange: mock.fn(),
    preflight: mock.fn(() => { sequence.push('bar'); return null }),
    settle: mock.fn(),
    dispose: mock.fn()
  }
]

let factory: DirectivesFactory

beforeEach(() => {
  resetCalls()
  sequence.length = 0

  for (const family of families) {
    assert.ok(family.preflight !== undefined)

    family.preflight.mock.mockImplementation(() => { sequence.push(family.name); return null })
  }

  factory = new DirectivesFactory(families, {} as unknown as Remotes)
})

it('should create directive', async () => {
  const declarations: syntax.Directive[] = [
    {
      family: 'foo',
      name: generate(),
      value: generate()
    },
    {
      family: 'bar',
      name: generate(),
      value: generate()
    }
  ]

  factory.create(declarations)

  for (const declaration of declarations) {
    const family = families.find(({ name }) => name === declaration.family)!

    assert.strictEqual(family.create.mock.calls[0].arguments[0], declaration.name)
    assert.strictEqual(family.create.mock.calls[0].arguments[1], declaration.value)
  }
})

it('should pass the route to the families', async () => {
  const route = '/' + generate()

  factory.create([{ family: 'foo', name: generate(), value: generate() }], route)

  assert.strictEqual(families[0].create.mock.calls[0].arguments[3], route)
})

it('should throw error if directive family is not found', async () => {
  const declaration: syntax.Directive = {
    family: generate(),
    name: generate(),
    value: generate()
  }

  assert.throws(() => factory.create([declaration]),
    (error: Error) => error.message.includes(`Directive family '${declaration.family}' is not found`))
})

it('should apply directive', async () => {
  const declaration: syntax.Directive = {
    family: 'foo',
    name: generate(),
    value: generate()
  }

  const directives = factory.create([declaration])
  const request = generate() as unknown as Context
  const directive = families[0].create.mock.calls[0].result

  await directives.preflight(request, [])

  assert.ok(families[0].preflight !== undefined)

  assert.deepStrictEqual(families[0].preflight.mock.calls[0].arguments[0], [directive])
  assert.deepStrictEqual(families[0].preflight.mock.calls[0].arguments[1], request)
})

it('should apply mandatory families', async () => {
  const directives = factory.create([])
  const request = generate() as unknown as Context

  await directives.preflight(request, [])

  assert.ok(families[0].preflight.mock.callCount() > 0)
})

describe('order', () => {
  // the order the families actually ran, as each preflight recorded it
  function order (): string[] {
    return sequence
  }

  it('should run mandatory families in their own order, whatever a manifest says', async () => {
    // `qux` declared first, but `foo` is registered first and both are mandatory
    const directives = factory.create([
      { family: 'qux', name: generate(), value: generate() },
      { family: 'foo', name: generate(), value: generate() }
    ])

    await directives.preflight(generate() as unknown as Context, [])

    assert.deepStrictEqual(order(), ['foo', 'qux'])
  })

  it('should run a mandatory family before a declared one it is not declared with',
    async () => {
      // only `qux` is declared: `foo` still has to run first, not merely first of
      // whatever had no declarations
      const directives = factory.create([
        { family: 'qux', name: generate(), value: generate() }
      ])

      await directives.preflight(generate() as unknown as Context, [])

      assert.deepStrictEqual(order(), ['foo', 'qux'])
    })

  it('should run mandatory families before the rest', async () => {
    const directives = factory.create([
      { family: 'bar', name: generate(), value: generate() },
      { family: 'qux', name: generate(), value: generate() }
    ])

    await directives.preflight(generate() as unknown as Context, [])

    assert.deepStrictEqual(order(), ['foo', 'qux', 'bar'])
  })
})

function resetCalls (target = [families], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
