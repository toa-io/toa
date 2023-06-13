import { generate } from 'randomstring'
import { createBranch, createRoot } from './factory'
import { Method } from './Method'
import type * as syntax from './syntax'
import { context } from './Context.mock'

const { namespace, name, remote } = context

it('should create node from RTD', async () => {
  const definition: syntax.Node = {
    '/foo': {},
    '/bar': {}
  }

  const node = createBranch(definition, context)

  expect(node.match([namespace, name, 'foo'])).not.toBeNull()
  expect(node.match([namespace, name, 'bar'])).not.toBeNull()
  expect(node.match([namespace, name, 'baz'])).toBeNull()
})

it('should create tree recurcively', async () => {
  const definition: syntax.Node = {
    '/foo': {
      '/nested': {}
    },
    '/bar': {
      '/nested': {}
    }
  }

  const node = createBranch(definition, context)

  expect(node.match([namespace, name, 'foo'])).not.toBeNull()
  expect(node.match([namespace, name, 'foo', 'nested'])).not.toBeNull()
  expect(node.match([namespace, name, 'bar'])).not.toBeNull()
  expect(node.match([namespace, name, 'bar', 'nested'])).not.toBeNull()
  expect(node.match([namespace, name, 'bar', 'baz'])).toBeNull()
})

it('should create root Route', async () => {
  const definition: syntax.Node = {
    '/': {},
  }

  const node = createBranch(definition, context)

  expect(node.match([namespace, name])).not.toBeNull()
})

it('should create nested root route', async () => {
  const definition: syntax.Node = {
    '/teapots': {
      '/': {
        '/cold': {}
      },
      '/hot': {}
    },
  }

  const node = createBranch(definition, context)

  expect(node.match([namespace, name, 'teapots', 'cold'])).not.toBeNull()
  expect(node.match([namespace, name, 'teapots', 'hot'])).not.toBeNull()
})

it('should create methods', async () => {
  const definition: syntax.Node = {
    '/': {
      GET: {
        endpoint: generate(),
        type: 'observation'
      }
    },
  }

  const node = createBranch(definition, context)
  const found = node.match([namespace, name])

  expect(found?.methods.has('GET')).toStrictEqual(true)

  const method = found?.methods.get('GET') as Method

  expect(method).toBeInstanceOf(Method)

  const body = generate()

  await method.call(body, {})

  expect(remote.invoke).toHaveBeenCalledWith(definition['/'].GET.endpoint, expect.anything())
})

it('should find methods below intermediate nodes', async () => {
  const definition: syntax.Node = {
    '/foo': {
      '/': {
        GET: {
          endpoint: generate(),
          type: 'observation'
        }
      }
    },
  }

  const node = createBranch(definition, context)
  const found = node.match([namespace, name, 'foo'])

  expect(found?.methods.has('GET')).toStrictEqual(true)
})

it('should omit default namespace', async () => {
  const ctx = { ...context, namespace: 'default' }

  const definition: syntax.Node = {
    '/foo': {}
  }

  const node = createBranch(definition, ctx)

  expect(node.match([namespace, name, 'foo'])).toBeNull()
  expect(node.match([name, 'foo'])).not.toBeNull()
})

it('should merge nodes', async () => {
  const context1 = { ...context, name: generate() }
  const context2 = { ...context, name: generate() }
  const definition = {}

  const branch1 = createBranch(definition, context1)
  const branch2 = createBranch(definition, context2)
  const node1 = branch1.match([namespace])
  const node2 = branch2.match([namespace])

  if (node1 === null || node2 === null) throw new Error('?')

  node1.merge(node2)

  expect(branch1.match([namespace, context2.name])).not.toBeNull()
  expect(branch1.match([namespace, context1.name])).not.toBeNull()
})

it('should replace node', async () => {
  const definition1 = { '/foo': {} }
  const definition2 = { '/bar': {} }
  const branch1 = createBranch(definition1, context)
  const branch2 = createBranch(definition2, context)
  const node1 = branch1.match([namespace, name])
  const node2 = branch2.match([namespace, name])

  if (node1 === null || node2 === null) throw new Error('?')

  node1.replace(node2)

  expect(branch1.match([namespace, name, 'foo'])).toBeNull()
  expect(branch1.match([namespace, name, 'bar'])).not.toBeNull()
})

it('should create root node', async () => {
  const definition = {}
  const root = createRoot()
  const branch = createBranch(definition, context)

  root.merge(branch)

  expect(root.match([namespace, name])).not.toBeNull()
})
