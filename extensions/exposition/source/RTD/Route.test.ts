import { generate } from 'randomstring'
import { Route } from './Route'
import { Node } from './Node'
import type { Segments } from './segment'
import { createNode, createRoute } from './factory'
import { Context } from './Context'

describe('own key', () => {
  const context = {} as Context
  let segments: Segments
  let route: Route
  let node: Node

  beforeEach(() => {
    segments = [generate(), generate()]
    const key = '/' + segments.join('/')
    node = createNode({}, context)
    route = createRoute(key, node, context)
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
