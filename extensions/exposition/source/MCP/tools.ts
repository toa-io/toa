import * as http from '../HTTP/index.js'
import { fork } from '../RPC/Context.js'
import { address, name, split } from '../RPC/names.js'
import { refusal } from './errors.js'
import { annotations, input, output } from './schema.js'
import type { Segment } from '../RTD/segment.js'
import type { Parameter, Tree } from '../RTD/index.js'
import type { Params, Result, Tool } from './types.js'

/**
 * Every method this caller may reach that says it is a tool, named as the procedure it is.
 *
 * The tree is walked once and each method describes itself, which is where `mcp:tool` says
 * so and where `auth` drops what this caller could only be refused. Sorted, because the
 * revision asks for an order a client can cache on.
 */
export async function list (tree: Tree, context: http.Context): Promise<Tool[]> {
  const tools: Tool[] = []

  for (const { segments, verb, method } of tree.walk()) {
    const named = name(segments, verb)

    if (named === null)
      continue

    const variables = parameters(segments)
    const introspection = await method.explain(context, variables)

    if (introspection?.tool === undefined)
      continue

    const tool: Tool = {
      name: named,
      description: introspection.tool,
      inputSchema: input(introspection, variables.map((variable) => variable.name))
    }

    const schema = output(introspection)

    if (schema !== undefined)
      tool.outputSchema = schema

    const hints = annotations(verb)

    if (hints !== undefined)
      tool.annotations = hints

    tools.push(tool)
  }

  return tools.sort((one, other) => one.name < other.name ? -1 : 1)
}

/**
 * The call the tool is. Its arguments are the procedure's parameters, taken apart the way a
 * request carries them, and what answers is the same `route` an ordinary request goes to.
 */
export async function call (scope: Scope, named: string, args: Params): Promise<Result> {
  const { path, verb, variables } = address(named, args)
  const { query, input: body } = split(args, variables)
  const clone = fork(scope.context, path, verb, query, body)

  // a procedure is not a tool unless it says so, and what is not one is not here to call
  const match = scope.tree.match(path)
  const method = match === null ? undefined : match.node.methods[verb]

  const introspection = method === undefined
    ? null
    : await method.explain(clone, match!.parameters)

  if (introspection?.tool === undefined)
    throw new http.NotFound(`'${named}' names no tool`)

  try {
    const message = await scope.route(clone)

    // what `io:output` restricts, over this call's reply rather than the envelope
    await http.shape(clone, message)

    return result(message.body)
  } catch (exception) {
    // what the operation refused with is a value a model reads, not a protocol error
    if (exception instanceof http.UnprocessableEntity)
      return { content: [{ type: 'text', text: refusal(exception) }], isError: true }

    throw exception
  }
}

/** Everything a call needs that is not the call: the tree it is in, and what answers it. */
export interface Scope {
  tree: Tree
  context: http.Context
  route: http.Processor
}

function result (body: unknown): Result {
  if (body === undefined || body === null)
    return { content: [] }

  return {
    content: [{ type: 'text', text: JSON.stringify(body) }],
    structuredContent: body
  }
}

/**
 * What a route template takes, by name. Describing has no values for them — a template is
 * not a path — and nothing that describes a method reads one.
 */
function parameters (segments: Segment[]): Parameter[] {
  const params: Parameter[] = []

  for (const segment of segments) {
    if (segment.fragment !== null)
      continue

    if (segment.wildcard === true)
      params.push({ name: '**', value: '' })
    else if (segment.placeholder !== null)
      params.push({ name: segment.placeholder, value: '' })
  }

  return params
}
