import { Node, type Properties } from './Node'
import { Route } from './Route'
import { type Context } from './Context'
import { segment } from './segment'
import { type MethodFactory, type Methods } from './Method'
import type * as syntax from './syntax'

export function createTrunk (definition: syntax.Node, methods: MethodFactory): Node {
  const context: Context = { protected: true, methods }

  return createNode(definition, context)
}

export function createBranch (node: syntax.Node, methods: MethodFactory, extensions: any): Node {
  const context: Context = { protected: false, methods, extensions }

  return createNode(node, context)
}

function createNode (node: syntax.Node, context: Context): Node {
  const routes: Route[] = node.routes.map((route) => createRoute(route, context))
  const methods: Methods = {}

  for (const method of node.methods)
    methods[method.verb] = context.methods.create(method, context)

  const properties: Properties = { protected: context.protected }

  return new Node(routes, methods, properties)
}

function createRoute (route: syntax.Route, context: Context): Route {
  const segments = segment(route.path)
  const node = createNode(route.node, context)

  return new Route(segments, node)
}
