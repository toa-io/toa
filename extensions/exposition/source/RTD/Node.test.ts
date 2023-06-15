import { generate } from 'randomstring'
import { createBranch, createTrunk } from './factory'
import { remotes } from './Context.mock'
import { Method } from './Method'
import type { Component } from '@toa.io/core'
import type * as syntax from './syntax'
import { Mapping } from './syntax'

const namespace = generate()
const component = generate()

beforeEach(() => {
  jest.clearAllMocks()
})

it('should create node from RTD', async () => {
  const definition: syntax.Branch = {
    namespace,
    component,
    node: {
      '/foo': {},
      '/bar': {}
    }
  }

  const node = createBranch(definition, remotes)

  expect(node.match([namespace, component, 'foo'])).not.toBeNull()
  expect(node.match([namespace, component, 'bar'])).not.toBeNull()
  expect(node.match([namespace, component, 'baz'])).toBeNull()
})

it('should create tree recurcively', async () => {
  const definition: syntax.Branch = {
    namespace,
    component,
    node: {
      '/foo': {
        '/nested': {}
      },
      '/bar': {
        '/nested': {}
      }
    }
  }

  const node = createBranch(definition, remotes)

  expect(node.match([namespace, component, 'foo'])).not.toBeNull()
  expect(node.match([namespace, component, 'foo', 'nested'])).not.toBeNull()
  expect(node.match([namespace, component, 'bar'])).not.toBeNull()
  expect(node.match([namespace, component, 'bar', 'nested'])).not.toBeNull()
  expect(node.match([namespace, component, 'bar', 'baz'])).toBeNull()
})

it('should create root Route', async () => {
  const definition: syntax.Branch = {
    namespace,
    component,
    node: {
      '/': {}
    }
  }

  const node = createBranch(definition, remotes)

  expect(node.match([namespace, component])).not.toBeNull()
})

it('should create nested root route', async () => {
  const definition: syntax.Branch = {
    namespace,
    component,
    node: {
      '/teapots': {
        '/': {
          '/cold': {}
        },
        '/hot': {}
      }
    }
  }

  const node = createBranch(definition, remotes)

  expect(node.match([namespace, component, 'teapots', 'cold'])).not.toBeNull()
  expect(node.match([namespace, component, 'teapots', 'hot'])).not.toBeNull()
})

it('should create methods', async () => {
  const GET: syntax.Mapping = {
    namespace,
    component,
    endpoint: generate(),
    type: 'observation'
  }

  const definition: syntax.Branch = {
    namespace,
    component,
    node: {
      '/': { GET }
    }
  }

  const node = createBranch(definition, remotes)
  const remote: jest.MockedObject<Component> = await remotes.discover.mock.results[0].value
  const found = node.match([namespace, component])

  if (found === null) throw new Error('?')

  expect(found.methods.has('GET')).toStrictEqual(true)

  const method = found.methods.get('GET') as Method

  expect(method).toBeInstanceOf(Method)

  const body = generate()

  await method.call(body, {})

  expect(remote.invoke).toHaveBeenCalledWith(GET.endpoint, expect.anything())
})

it('should find methods below intermediate nodes', async () => {
  const definition: syntax.Branch = {
    namespace,
    component,
    node: {
      '/foo': {
        '/': {
          GET: {
            endpoint: generate(),
            type: 'observation'
          }
        }
      }
    }
  }

  const node = createBranch(definition, remotes)
  const found = node.match([namespace, component, 'foo'])

  expect(found?.methods.has('GET')).toStrictEqual(true)
})

it('should omit default namespace', async () => {
  const namespace = 'default'

  const definition: syntax.Branch = {
    namespace,
    component,
    node: {
      '/foo': {}
    }
  }

  const node = createBranch(definition, remotes)

  expect(node.match([namespace, component, 'foo'])).toBeNull()
  expect(node.match([component, 'foo'])).not.toBeNull()
})

it('should create trunk', async () => {
  const GET: Mapping = {
    namespace,
    component,
    endpoint: generate(),
    type: 'observation'
  }

  const definition: syntax.Node = {
    '/foo': { GET }
  }

  const trunk = createTrunk(definition, remotes)
  const foo = trunk.match(['foo'])

  expect(trunk.match(['foo'])).not.toBeNull()

  const get = foo?.methods.get('GET')

  if (get === undefined) throw new Error('?')

  expect(get).toBeDefined()
  expect(remotes.discover).toHaveBeenCalledWith(namespace, component)

  const remote: jest.MockedObject<Component> = await remotes.discover.mock.results[0].value

  await get.call(null, {})

  expect(remote.invoke).toHaveBeenCalledWith(GET.endpoint, expect.anything())
})

it('should merge nodes', async () => {
  const definition1 = defineBranch({ '/foo': { GET: {} } })
  const definition2 = defineBranch({ '/bar': { POST: {} } })

  const node1 = createBranch(definition1, remotes)
  const node2 = createBranch(definition2, remotes)

  node1.merge(node2)

  expect(node1.match([namespace, component, 'foo'])).not.toBeNull()
  expect(node2.match([namespace, component, 'bar'])).not.toBeNull()

  expect(node1.match([namespace, component, 'bar'])).not.toBeNull()
  expect(node2.match([namespace, component, 'foo'])).toBeNull()
})

it('should merge methods', async () => {
  const definition1 = defineBranch({ '/foo': { GET: {} } })
  const definition2 = defineBranch({ '/foo': { POST: {} } })
  const node1 = createBranch(definition1, remotes)
  const node2 = createBranch(definition2, remotes)

  node1.merge(node2)

  const node = node1.match([namespace, component, 'foo'])

  if (node === null) throw new Error('?')

  expect(node.methods.has('GET')).toStrictEqual(true)
  expect(node.methods.has('POST')).toStrictEqual(true)
})

it('should not overwrite methods in the trunk', async () => {
  const trunkEndpoint = generate()

  const trunkDefinition = {
    ['/' + namespace]: {
      ['/' + component]: {
        '/foo': {
          GET: {
            namespace,
            component,
            endpoint: trunkEndpoint
          }
        }
      }
    }
  }

  const branchEndpoint = generate()

  const branchDefinition = defineBranch({
    '/foo': {
      GET: {
        namespace,
        component,
        endpoint: branchEndpoint
      }
    }
  })

  const trunk = createTrunk(trunkDefinition, remotes)
  const branch = createBranch(branchDefinition, remotes)

  trunk.merge(branch)

  const node = trunk.match([namespace, component, 'foo'])
  const method = node?.methods.get('GET')
  const trunkRemote: jest.MockedObject<Component> = await remotes.discover.mock.results[0].value
  const branchRemote: jest.MockedObject<Component> = await remotes.discover.mock.results[1].value

  if (method === undefined) throw new Error('?')

  await method.call({}, {})

  expect(branchRemote.invoke).not.toHaveBeenCalled()
  expect(trunkRemote.invoke).toHaveBeenCalledWith(trunkEndpoint, expect.anything())
})

function defineBranch (node: syntax.Node): syntax.Branch {
  return { namespace, component, node }
}
