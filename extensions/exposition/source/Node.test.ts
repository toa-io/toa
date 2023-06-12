import { generate } from 'randomstring'
import { flip } from '@toa.io/generic'
import { Node } from './Node'
import { Route } from './Route'
import type * as syntax from './RTD/syntax'

it('should return nested node if one of the routes matches', async () => {
  const node1 = new Node([], new Map(), false)
  const segments1 = [generate(), generate()]
  const route1 = new Route(segments1, node1)

  const node2 = new Node([], new Map(), false)
  const segments2 = [generate(), generate()]
  const route2 = new Route(segments2, node2)

  const routes = [route1, route2]
  const node = new Node(routes, new Map(), false)

  const match1 = node.match(segments1)
  const match2 = node.match(segments2)
  const match3 = node.match([generate(), generate()])

  expect(match1).toBe(node1)
  expect(match2).toBe(node2)
  expect(match3).toStrictEqual(null)
})

it('should expose `intermediate` property', async () => {
  const intermediate = flip()
  const node = new Node([], new Map(), intermediate)

  expect(node.intermediate).toStrictEqual(intermediate)
})

describe('factory', () => {
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
})
