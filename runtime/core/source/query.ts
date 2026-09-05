import { empty } from '@toa.io/generic'
import * as criteria from './query/criteria.js'
import * as options from './query/options.js'
import type { Properties } from './query/criteria.js'
import type { Node, Options, Query as Parsed } from './types/storages.js'
import type { Query as Requested } from './types/request.js'

const parse = { ...criteria, ...options }

/** Translates the query a request carries into the one a storage is given. */
export class Query {
  readonly #properties: Properties

  /** parsed criteria by their expression */
  readonly #asts = new Map<string, Node>()

  public constructor (properties: Properties) {
    this.#properties = properties
  }

  public parse (query: Requested): Parsed {
    const result: Parsed = {}
    const { id, ids, version, criteria, search, ...rest } = query

    const options = this.#options(rest)

    if (id !== undefined) result.id = id
    if (ids !== undefined) result.ids = ids
    if (version !== undefined) result.version = version
    if (criteria !== undefined) result.criteria = this.#criteria(criteria)
    if (search !== undefined) result.search = search
    if (options !== undefined) result.options = options

    return result
  }

  #options (given: Record<string, any>): Options | undefined {
    if (empty(given)) return undefined

    return parse.options(given, this.#properties)
  }

  /**
   * Lexing an RSQL expression is the most expensive thing this class does, and the same
   * expression arrives over and over: a route builds it from its own declaration and the
   * request parameters. The tree is only read downstream — a storage builds a fresh query
   * from it — so it is kept rather than parsed again.
   *
   * Expressions come from the client, hence the bound. An invalid one throws before it
   * reaches the cache.
   */
  #criteria (criteria: string): Node {
    const known = this.#asts.get(criteria)

    if (known !== undefined) return known

    const ast = parse.criteria(criteria, this.#properties)

    if (this.#asts.size >= LIMIT) this.#asts.clear()

    this.#asts.set(criteria, ast)

    return ast
  }
}

const LIMIT = 1024
