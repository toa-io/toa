import { generate } from 'randomstring'
import { Node } from './Node'
import { Route } from './Route'

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

  expect(match1).toBe(node1)
  expect(match2).toBe(node2)
})
