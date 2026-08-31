import assert from 'node:assert'
import { generate } from 'randomstring'
import { DirectivesFactory } from './Directive'
import type { syntax, DirectiveFamily } from './RTD'
import type { Remotes } from './Remotes'
import type { Context } from './HTTP'

const families: Array<jest.MockedObjectDeep<DirectiveFamily>> = [
  {
    name: 'foo',
    mandatory: true,
    create: jest.fn((_0: any, _1: any, _2: any) => generate() as any),
    arrange: jest.fn(),
    preflight: jest.fn(),
    settle: jest.fn(),
    dispose: jest.fn()
  },
  {
    name: 'qux',
    mandatory: true,
    create: jest.fn((_0: any, _1: any, _2: any) => generate() as any),
    arrange: jest.fn(),
    preflight: jest.fn(),
    settle: jest.fn(),
    dispose: jest.fn()
  },
  {
    name: 'bar',
    mandatory: false,
    create: jest.fn((_0: string, _1: any, _2: any) => generate() as any),
    arrange: jest.fn(),
    preflight: jest.fn(),
    settle: jest.fn(),
    dispose: jest.fn()
  }
]

let factory: DirectivesFactory

beforeEach(() => {
  jest.clearAllMocks()

  for (const family of families) {
    assert.ok(family.preflight !== undefined)

    family.preflight.mockImplementation(() => null)
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

    expect(family.create.mock.calls[0][0]).toBe(declaration.name)
    expect(family.create.mock.calls[0][1]).toBe(declaration.value)
  }
})

it('should pass the route to the families', async () => {
  const route = '/' + generate()

  factory.create([{ family: 'foo', name: generate(), value: generate() }], route)

  expect(families[0].create.mock.calls[0][3]).toBe(route)
})

it('should throw error if directive family is not found', async () => {
  const declaration: syntax.Directive = {
    family: generate(),
    name: generate(),
    value: generate()
  }

  expect(() => factory.create([declaration]))
    .toThrow(`Directive family '${declaration.family}' is not found`)
})

it('should apply directive', async () => {
  const declaration: syntax.Directive = {
    family: 'foo',
    name: generate(),
    value: generate()
  }

  const directives = factory.create([declaration])
  const request = generate() as unknown as Context
  const directive = families[0].create.mock.results[0].value

  await directives.preflight(request, [])

  assert.ok(families[0].preflight !== undefined)

  expect(families[0].preflight.mock.calls[0][0]).toStrictEqual([directive])
  expect(families[0].preflight.mock.calls[0][1]).toEqual(request)
})

it('should apply mandatory families', async () => {
  const directives = factory.create([])
  const request = generate() as unknown as Context

  await directives.preflight(request, [])

  expect(families[0].preflight).toHaveBeenCalled()
})

describe('order', () => {
  function order (): string[] {
    return families
      .filter(({ preflight }) => preflight!.mock.calls.length > 0)
      .sort((a, b) => a.preflight!.mock.invocationCallOrder[0] -
        b.preflight!.mock.invocationCallOrder[0])
      .map(({ name }) => name)
  }

  it('should run mandatory families in their own order, whatever a manifest says', async () => {
    // `qux` declared first, but `foo` is registered first and both are mandatory
    const directives = factory.create([
      { family: 'qux', name: generate(), value: generate() },
      { family: 'foo', name: generate(), value: generate() }
    ])

    await directives.preflight(generate() as unknown as Context, [])

    expect(order()).toStrictEqual(['foo', 'qux'])
  })

  it('should run a mandatory family before a declared one it is not declared with',
    async () => {
      // only `qux` is declared: `foo` still has to run first, not merely first of
      // whatever had no declarations
      const directives = factory.create([
        { family: 'qux', name: generate(), value: generate() }
      ])

      await directives.preflight(generate() as unknown as Context, [])

      expect(order()).toStrictEqual(['foo', 'qux'])
    })

  it('should run mandatory families before the rest', async () => {
    const directives = factory.create([
      { family: 'bar', name: generate(), value: generate() },
      { family: 'qux', name: generate(), value: generate() }
    ])

    await directives.preflight(generate() as unknown as Context, [])

    expect(order()).toStrictEqual(['foo', 'qux', 'bar'])
  })
})
