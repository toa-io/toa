import { type Parameter } from './Match'
import { Query } from './Query'
import type * as http from '../HTTP'
import type * as syntax from './syntax'
import type * as core from '@toa.io/core'

export abstract class Mapping {
  public static create (method: syntax.Method, query?: syntax.Query): Mapping {
    if (method === 'POST')
      return new NonQueryableMapping()

    const q = new Query(query as syntax.Query)

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

class NonQueryableMapping extends Mapping {
  public fit (input: any): core.Request {
    return { input }
  }
}
