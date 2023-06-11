import { generate } from 'randomstring'
import { Node } from './Node'
import { Route } from './Route'
import type * as syntax from './RTD/syntax'

it('should return nested node if one of the routes matches', async () => {
  const node1 = new Node()
  const segments1 = [generate(), generate()]
  const route1 = new Route(segments1, node1)

  const node2 = new Node()
  const segments2 = [generate(), generate()]
  const route2 = new Route(segments2, node2)

  const routes = [route1, route2]
  const node = new Node(routes)

  const match1 = node.match(segments1)
  const match2 = node.match(segments2)
  const match3 = node.match([generate(), generate()])

  expect(match1).toBe(node1)
  expect(match2).toBe(node2)
  expect(match3).toStrictEqual(null)
})

describe('factory', () => {
  it('should create Node from RTD', async () => {
    const definition: syntax.Node = {
      '/foo': {},
      '/bar': {}
    }

    const node = Node.create(definition)

    expect(node.match(['foo'])).not.toBeNull()
    expect(node.match(['bar'])).not.toBeNull()
    expect(node.match(['baz'])).toBeNull()
  })

  it('should create Tree recurcively', async () => {
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

  it('should create nested root Route', async () => {
    const definition: syntax.Node = {
      '/teapots': {
        '/': {
          GET: {},
          '/cold': {}
        },
        '/hot': {}
      },
    }

    const node = Node.create(definition)

    expect(node.match(['teapots', 'cold'])).not.toBeNull()
    expect(node.match(['teapots', 'hot'])).not.toBeNull()
  })
})
