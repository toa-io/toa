import { generate } from 'randomstring'
import { Route } from './Route'
import { Node } from './Node'
import type { Segments } from './segment'

describe('own key', () => {
  let segments: Segments
  let route: Route
  let node: Node

  beforeEach(() => {
    segments = [generate(), generate()]
    node = Node.create({})
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

  it('should match placeholders', async () => {
    segments = [generate(), null, generate()]
    route = new Route(segments, node)

    segments = [...segments]
    segments[1] = generate()

    const match = route.match(segments)

    expect(match).toBe(node)
  })
})
