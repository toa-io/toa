import { type Remotes } from '../Remotes'
import { Node, type Properties } from './Node'
import { Route } from './Route'
import { Method, type Methods } from './Method'
import { Endpoint } from './Endpoint'
import { type Context } from './Context'
import * as syntax from './syntax'
import { segment } from './segment'
import { Mapping } from './Mapping'

export function createTrunk (definition: syntax.Node, remotes: Remotes): Node {
  const context: Context = { protected: true, remotes }

  return createNode(definition, context)
}

export function createBranch (branch: syntax.Branch, remotes: Remotes): Node {
  const definition = createBranchDefinition(branch)
  const discovery = remotes.discover(branch.namespace, branch.component)
  const context: Context = { discovery, protected: false }

  return createNode(definition, context)
}

function createNode (definition: syntax.Node, context: Context): Node {
  const routes: Route[] = []
  const methods: Methods = new Map()
  const intermediate = '/' in definition

  for (const [key, value] of Object.entries(definition))
    if (key[0] === '/') {
      const route = createRoute(key, value, context)

      routes.push(route)
    } else if (syntax.methods.has(key)) {
      const method = createMethod(key, value, context)

      methods.set(key, method)
    }

  routes.sort((a, b) => a.variables - b.variables)

  const properties: Properties = {
    intermediate,
    protected: context.protected
  }

  return new Node(routes, methods, properties)
}

function createRoute (key: string, definition: syntax.Node, context: Context): Route {
  const segments = segment(key)
  const node = createNode(definition, context)

  return new Route(segments, node)
}

function createMethod (method: syntax.Method, mapping: syntax.Mapping, context: Context): Method {
  if (context.discovery === undefined) {
    if (context.remotes === undefined)
      throw new Error('?')

    context.discovery = context.remotes.discover(mapping.namespace, mapping.component)
  }

  const endpoint = new Endpoint(context.discovery, mapping.endpoint)
  const map = Mapping.create(method, mapping.query)

  return new Method(endpoint, map)
}

function createBranchDefinition (branch: syntax.Branch): syntax.Node {
  let node = createNodeDefinition(branch.component, branch.node)

  if (branch.namespace !== 'default')
    node = createNodeDefinition(branch.namespace, node)

  return node
}

function createNodeDefinition (segment: string, node: syntax.Node): syntax.Node {
  const key = '/' + segment

  return { [key]: node }
}
