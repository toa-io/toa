import { generate } from 'randomstring'
import { type Node } from './Node'
import { createBranch } from './factory'
import * as syntax from './syntax'
import { context } from './Context.mock'
import { Route } from './Route'

const namespace = generate()
const component = generate()

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

  branch = createBranch(definition, context)
})

it('should match own key', async () => {
  const match = branch.match([namespace])

  expect(match).not.toBeNull()
})

it('should not match key with different segment', async () => {
  const match = branch.match([namespace, generate()])

  expect(match).toBeNull()
})

it('should not match key with extra segment', async () => {
  const match = branch.match([namespace, component, generate()])

  expect(match).toBeNull()
})

it('should not match key with missing segment', async () => {
  const match = branch.match([component])

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

  const branch = createBranch(definition, context)
  const match = branch.match([namespace, component, generate()])

  expect(match).not.toBeNull()
})

it('should compare equal routes', async () => {
  const node = {} as Node
  const segment = generate()
  const route1 = new Route([segment], node)
  const route2 = new Route([segment], node)
  const route3 = new Route([segment, generate()], node)

  expect(route1.equals(route2)).toStrictEqual(true)
  expect(route2.equals(route1)).toStrictEqual(true)
  expect(route1.equals(route3)).toStrictEqual(false)
  expect(route3.equals(route1)).toStrictEqual(false)
})
