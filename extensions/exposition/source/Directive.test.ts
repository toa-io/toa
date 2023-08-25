import { generate } from 'randomstring'
import { DirectivesFactory, type Family } from './Directive'
import { type syntax } from './RTD'
import { type IncomingMessage } from './HTTP'

const families: Array<jest.MockedObject<Family>> = [
  {
    name: 'foo',
    create: jest.fn((_: string, __: any) => generate() as any),
    apply: jest.fn()
  },
  {
    name: 'bar',
    create: jest.fn((_: string, __: any) => generate() as any),
    apply: jest.fn()
  }
]

let factory: DirectivesFactory

beforeEach(() => {
  jest.clearAllMocks()

  factory = new DirectivesFactory(families)
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

  for (let i = 0; i < declarations.length; i++)
    expect(families[i].create).toHaveBeenCalledWith(declarations[i].name, declarations[i].value)
})

it('should throw error if directive family is not found', async () => {
  const declaration: syntax.Directive = {
    family: generate(),
    name: generate(),
    value: generate()
  }

  expect(() => factory.create([declaration]))
    .toThrowError(`Directive family '${declaration.family}' not found.`)
})

it('should apply directive', async () => {
  const declaration: syntax.Directive = {
    family: 'foo',
    name: generate(),
    value: generate()
  }

  const directives = factory.create([declaration])
  const request = generate() as unknown as IncomingMessage
  const directive = families[0].create.mock.results[0].value

  await directives.apply(request)

  expect(families[0].apply).toHaveBeenCalledWith(request, [directive])
})
