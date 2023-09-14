import { type Parameter } from './RTD'
import { Query } from './Query'
import type * as http from './HTTP'
import type * as syntax from './RTD/syntax'
import type * as core from '@toa.io/core'

export abstract class Mapping {
  public static create (verb: string, query?: syntax.Query): Mapping {
    if (verb === 'POST')
      return new InputMapping()

    if (query === undefined)
      throw new Error(`Query constraints must be defined for ${verb}`)

    const q = new Query(query)

    return new QueryableMapping(q)
  }

  public abstract fit (input: any, qs: http.Query, parameters: Parameter[]): core.Request
}

class QueryableMapping extends Mapping {
  private readonly query: Query

  public constructor (query: Query) {
    super()

    this.query = query
  }

  public fit (input: any, qs: http.Query, parameters: Parameter[]): core.Request {
    const query = this.query.fit(qs, parameters)

    return { input, query }
  }
}

class InputMapping extends Mapping {
  public fit (body: any, _: unknown, parameters: Parameter[]): core.Request {
    const input = { ...body }

    for (const parameter of parameters)
      input[parameter.name] = parameter.value

    return { input }
  }
}
