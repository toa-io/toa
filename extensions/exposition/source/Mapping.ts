import { type Parameter } from './RTD/index.ts'
import { Query } from './Query.ts'
import type { Introspection, Schema } from './Introspection.ts'
import type { QueryString } from './Query.ts'
import type * as http from './HTTP/index.ts'
import type * as syntax from './RTD/syntax/index.ts'
import type * as core from '@toa.io/core/types'

export abstract class Mapping {
  protected readonly query: Query
  public abstract readonly queryable: boolean

  public constructor(query: Query) {
    this.query = query
  }

  public static create(query?: syntax.Query | null, paged?: boolean): Mapping {
    const q = new Query(query!, paged)

    return queryable(query) ? new QueryableMapping(q) : new InputMapping(q)
  }

  public explain(introspection: Introspection): Record<string, Schema> | null {
    return this.query.explain(introspection)
  }

  /** What picks the records a call is about; see `Query.selection`. */
  public selection(): Record<string, Schema> | null {
    return this.query.selection()
  }

  protected assign(input: any, qs: QueryString): void {
    if (qs.parameters !== null) {
      if (typeof input !== 'object' || input === null)
        throw new Error('Input must be an object to embed query parameters')

      Object.assign(input, qs.parameters)
    }
  }

  public abstract fit(
    input: any,
    query: http.Query,
    parameters: Parameter[]
  ): core.Request
}

class QueryableMapping extends Mapping {
  public override readonly queryable = true

  public fit(input: any, query: http.Query, parameters: Parameter[]): core.Request {
    const request: core.Request = {}
    const qs = this.query.fit(query, parameters)

    if (input === undefined && qs.parameters !== null) input = {}

    this.assign(input, qs)

    if (input !== undefined) request.input = input

    if (qs.query !== null) request.query = qs.query

    return request
  }
}

class InputMapping extends Mapping {
  public override readonly queryable = false

  public fit(input: any, query: http.Query, parameters: Parameter[]): core.Request {
    const request: core.Request = {}
    const qs = this.query.fit(query, parameters)

    if (
      input === undefined &&
      (this.query.parameterized || parameters.length > 0 || qs.parameters !== null)
    )
      input = {}

    if (parameters.length > 0) {
      if (typeof input !== 'object' || input === null)
        throw new Error('Input must be an object to embed parameters')

      for (const parameter of parameters) input[parameter.name] = parameter.value
    }

    this.assign(input, qs)

    if (input !== undefined) request.input = input

    return request
  }
}

export function queryable(query?: syntax.Query | null): boolean {
  if (query === undefined || query === null) return false

  const keys = Object.keys(query)

  return !(keys.length === 1 && keys[0] === 'parameters')
}
