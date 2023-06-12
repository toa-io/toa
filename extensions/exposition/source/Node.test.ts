import { generate } from 'randomstring'
import { Node } from './Node'
import type * as syntax from './RTD/syntax'

it('should create node from RTD', async () => {
  const definition: syntax.Node = {
    '/foo': {},
    '/bar': {}
  }

  const node = Node.create(definition)

  expect(node.match(['foo'])).not.toBeNull()
  expect(node.match(['bar'])).not.toBeNull()
  expect(node.match(['baz'])).toBeNull()
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

  const node = Node.create(definition)

  expect(node.match(['foo'])).not.toBeNull()
  expect(node.match(['foo', 'nested'])).not.toBeNull()
  expect(node.match(['bar'])).not.toBeNull()
  expect(node.match(['bar', 'nested'])).not.toBeNull()
  expect(node.match(['bar', 'baz'])).toBeNull()
})

it('should create root Route', async () => {
  const definition: syntax.Node = {
    '/': {},
  }

  const node = Node.create(definition)

  expect(node.match([])).not.toBeNull()
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

  const node = Node.create(definition)

  expect(node.match(['teapots', 'cold'])).not.toBeNull()
  expect(node.match(['teapots', 'hot'])).not.toBeNull()
})

it('should create methods', async () => {
  const definition: syntax.Node = {
    '/': {
      GET: {
        operation: generate(),
        type: 'observation'
      }
    },
  }

  const node = Node.create(definition)
  const found = node.match([])

  expect(found?.methods.has('GET')).toStrictEqual(true)
  expect(found?.methods.get('GET')).toStrictEqual(definition['/'].GET)
})

it('should find methods below intermediate nodes', async () => {
  const definition: syntax.Node = {
    '/foo': {
      '/': {
        GET: {
          operation: generate(),
          type: 'observation'
        }
      }
    },
  }

  const node = Node.create(definition)
  const found = node.match(['foo'])

  expect(found?.methods.has('GET')).toStrictEqual(true)
})
