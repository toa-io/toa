import * as http from '../HTTP/index.js'
import { fork } from '../RPC/Context.js'
import { address, name, split } from '../RPC/names.js'
import { refusal } from './errors.js'
import { annotations, input, output } from './schema.js'
import type { Segment } from '../RTD/segment.js'
import type { Parameter, Tree } from '../RTD/index.js'
import type { Params, Result, Tool } from './types.js'

/**
 * Every method this caller may reach, named as the procedure it is.
 *
 * Nothing is declared to make a tool, as nothing is declared to make a procedure: what is
 * exposed as a resource is a tool, and what a caller may do with it is what `auth` says. The
 * tree is walked once and each method describes itself, which is where that is decided and
 * where `io` and `map` say what may be sent.
 *
 * Sorted, because the revision asks for an order a client can cache on.
 */
export async function list (tree: Tree, context: http.Context): Promise<Tool[]> {
  const tools: Tool[] = []

  /*
   * Each method is described as the procedure it would be, not as the request asking. What
   * refuses a credentialed request at an `anonymous` route does not refuse the call a tool
   * makes, and a list that says otherwise disagrees with what `tools/call` then does.
   */
  const describing: http.Context = Object.create(context,
    { procedural: { value: true, enumerable: true } })

  for (const { segments, verb, method } of tree.walk()) {
    const named = name(segments, verb)

    // a route a name cannot spell is a route nothing addresses, here or at `/.rpc`
    if (named === null)
      continue

    const variables = parameters(segments)
    const introspection = await method.explain(describing, variables)

    if (introspection === null)
      continue

    const described = introspection.description
    const schema = output(introspection)
    const hints = annotations(verb)

    // in the order the revision documents one, which is the order it is read in
    const tool: Tool = {
      name: named,
      ...described === undefined ? {} : { description: described },
      inputSchema: input(introspection, variables.map((variable) => variable.name)),
      ...schema === undefined ? {} : { outputSchema: schema },
      ...hints === undefined ? {} : { annotations: hints }
    }

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

/** Everything a call needs that is not the call: the request it is of, and what answers it. */
export interface Scope {
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
