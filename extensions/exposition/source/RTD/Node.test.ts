import { generate } from 'randomstring'
import { createNode } from './factory'
import { Method } from './Method'
import { Component } from '@toa.io/core'
import { Context } from './Context'
import type * as syntax from './syntax'

const remote = {
  invoke: jest.fn(async () => generate())
} as unknown as jest.MockedObject<Component>

const context: Context = { remote }

it('should create node from RTD', async () => {
  const definition: syntax.Node = {
    '/foo': {},
    '/bar': {}
  }

  const node = createNode(definition, context)

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

  const node = createNode(definition, context)

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

  const node = createNode(definition, context)

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

  const node = createNode(definition, context)

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

  const node = createNode(definition, context)
  const found = node.match([])

  expect(found?.methods.has('GET')).toStrictEqual(true)
  expect(found?.methods.get('GET')).toBeInstanceOf(Method)
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

  const node = createNode(definition, context)
  const found = node.match(['foo'])

  expect(found?.methods.has('GET')).toStrictEqual(true)
})
