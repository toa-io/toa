import { generate } from 'randomstring'
import { Route } from './Route'
import { Node } from './Node'

describe('own key', () => {
  let segments: string[]
  let route: Route
  let node: Node

  beforeEach(() => {
    segments = [generate(), generate()]
    node = new Node()
    route = new Route(segments, node)
    segments = [...segments] // clone
  })

  it('should match own key', async () => {
    const match = route.match(segments)

    expect(match).toStrictEqual(node)
  })

  it('should not match key with different segment', async () => {
    segments[1] = generate()

    const match = route.match(segments)

    expect(match).toStrictEqual(null)
  })

  it('should not match key with extra segment', async () => {
    segments.push(generate())

    const match = route.match(segments)

    expect(match).toStrictEqual(null)
  })

  it('should not match key with missing segment', async () => {
    segments.pop()

    const match = route.match(segments)

    expect(match).toStrictEqual(null)
  })
})

describe('nested routes', () => {
  it('should return nested matching nodes', async () => {
    const node1 = new Node()
    const segments1 = [generate(), generate()]
    const route1 = new Route(segments1, node1)
    const node2 = new Node()
    const segments2 = [generate(), generate()]
    const route2 = new Route(segments2, node2)

    const node = new Node([route1, route2])
    const segments = [generate(), generate()]
    const route = new Route(segments, node)

    const match1 = route.match([...segments, ...segments1])
    const match2 = route.match([...segments, ...segments2])

    expect(match1).toBe(node1)
    expect(match2).toBe(node2)
  })
})
