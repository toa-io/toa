import { BRANCH_TTL } from '../const.js'
import { Node, type Properties } from './Node.js'
import { Route } from './Route.js'
import { segment } from './segment.js'
import { Method, type Methods } from './Method.js'
import type { Context } from './Context.js'
import type * as syntax from './syntax/index.js'

export function createNode (node: syntax.Node, context: Context): Node {
  if (node.isolated === true)
    context.directives.stack = node.directives
  else
    context.directives.stack = node.directives.concat(context.directives.stack)

  const routes: Route[] = node.routes.map((route) => createRoute(route, context))
  const methods: Methods = {}

  for (const method of node.methods)
    methods[method.verb] = createMethod(method, context)

  const protect = node.protected ?? context.protected

  const properties: Properties = {
    protected: protect,
    forward: node.forward,
    expiration: protect ? Infinity : Date.now() + branchTTL()
  }

  return new Node(routes, methods, properties)
}

export function branchTTL (): number {
  const value = process.env.__TESTING_EXPOSITION_BRANCH_TTL

  if (value === undefined || value === '')
    return BRANCH_TTL

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : BRANCH_TTL
}

function createRoute (route: syntax.Route, context: Context): Route {
  const stack = context.directives.stack.slice()
  const path = context.path
  const segments = segment(route.path)

  context.path = join(path, route.path)

  const node = createNode(route.node, context)

  context.directives.stack = stack // restore
  context.path = path

  return new Route(segments, node)
}

function join (base: string, path: string): string {
  // '/one/' and '/two/' would otherwise read as '/one//two/'
  return (base + path).replace(/\/+/g, '/').replace(/(.)\/$/, '$1')
}

function createMethod (method: syntax.Method, context: Context): Method {
  const stack = method.directives.concat(context.directives.stack)
  const directives = context.directives.factory.create(stack, context.path)

  const endpoint = method.mapping?.endpoint === undefined
    ? null
    : context.endpoints.create(method, context)

  return new Method(endpoint, directives)
}
