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
    preflight: jest.fn(),
    settle: jest.fn()
  },
  {
    name: 'bar',
    mandatory: false,
    create: jest.fn((_0: string, _1: any, _2: any) => generate() as any),
    preflight: jest.fn(),
    settle: jest.fn()
  }
]

let factory: DirectivesFactory

beforeEach(() => {
  jest.clearAllMocks()

  assert.ok(families[0].preflight !== undefined)
  assert.ok(families[1].preflight !== undefined)

  families[0].preflight.mockImplementation(() => null)
  families[1].preflight.mockImplementation(() => null)
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

  for (let i = 0; i < declarations.length; i++) {
    expect(families[i].create.mock.calls[0][0]).toBe(declarations[i].name)
    expect(families[i].create.mock.calls[0][1]).toBe(declarations[i].value)
  }
})

it('should throw error if directive family is not found', async () => {
  const declaration: syntax.Directive = {
    family: generate(),
    name: generate(),
    value: generate()
  }

  expect(() => factory.create([declaration]))
    .toThrowError(`Directive family '${declaration.family}' is not found`)
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
