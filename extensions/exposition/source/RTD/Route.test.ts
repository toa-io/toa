import { generate } from 'randomstring'
import { type Node } from './Node'
import { createBranch } from './factory'
import { remotes } from './Context.mock'
import { Route } from './Route'
import { type Segment } from './segment'
import { type Parameter } from './Match'
import type * as syntax from './syntax'

const namespace = 'ns-' + generate()
const component = 'co-' + generate()

const definition: syntax.Branch = {
  namespace,
  component,
  node: {
    '/': {}
  }
}

let branch: Node

beforeEach(() => {
  jest.clearAllMocks()

  branch = createBranch(definition, remotes)
})

it('should match own key', async () => {
  const match = branch.match([namespace], [])

  expect(match).not.toBeNull()
})

it('should not match key with different segment', async () => {
  const match = branch.match([namespace, generate()], [])

  expect(match).toBeNull()
})

it('should not match key with extra segment', async () => {
  const match = branch.match([namespace, component, generate()], [])

  expect(match).toBeNull()
})

it('should not match key with missing segment', async () => {
  const match = branch.match([component], [])

  expect(match).toBeNull()
})

it('should match placeholders', async () => {
  const definition: syntax.Branch = {
    namespace,
    component,
    node: {
      '/:user-id': {}
    }
  }

  const branch = createBranch(definition, remotes)
  const match = branch.match([namespace, component, generate()], [])

  expect(match).not.toBeNull()
})

it('should compare equal routes', async () => {
  const node = {} as unknown as Node
  const segment: Segment = { fragment: generate() }
  const route1 = new Route([segment], node)
  const route2 = new Route([segment], node)
  const route3 = new Route([segment, { fragment: generate() }], node)

  expect(route1.equals(route2)).toStrictEqual(true)
  expect(route2.equals(route1)).toStrictEqual(true)
  expect(route1.equals(route3)).toStrictEqual(false)
  expect(route3.equals(route1)).toStrictEqual(false)
})

it('should add parameters', async () => {
  const segments: Segment[] = [
    { fragment: 'foo' },
    { fragment: null, placeholder: 'foo' }
  ]
  const node = {} as unknown as Node
  const route = new Route(segments, node)
  const parameters: Parameter[] = []
  const fragment = generate()

  route.match(['foo', fragment], parameters)

  expect(parameters).toHaveLength(1)
  expect(parameters[0].name).toStrictEqual('foo')
  expect(parameters[0].value).toStrictEqual(fragment)
})
