import { generate } from 'randomstring'
import { createBranch } from './factory'
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
