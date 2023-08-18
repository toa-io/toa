import { type Query, type Request } from '@toa.io/core'
import { type HTTPQuery } from '../HTTP'
import { type Parameter } from './Match'
import type * as syntax from './syntax'

export abstract class Mapping {
  public static create (method: syntax.Method): Mapping {
    if (method === 'POST') return new NonQueryableMapping()
    else return new QueryableMapping()
  }

  public abstract fit (input: any, qs: HTTPQuery, parameters: Parameter[]): Request
}

class QueryableMapping extends Mapping {
  public fit (input: any, qs: HTTPQuery, parameters: Parameter[]): Request {
    const query = this.query(qs, parameters)

    return { input, query }
  }

  private query (qs: HTTPQuery, parameters: Parameter[]): Query {
    const query = qs as Query

    this.addParameters(query, parameters)

    if (qs.sort !== undefined)
      query.sort = qs.sort.split(';')

    return query
  }

  private addParameters (query: Query, parameters: Parameter[]): void {
    const criteria: string[] = []

    if (parameters.length > 0) {
      const chunks = parameters.map(({ name, value }) => `${name}==${value}`)

      criteria.push(...chunks)
    }

    if (query.criteria !== undefined)
      if (criteria.length > 0)
        criteria.push('(' + query.criteria + ')')
      else
        criteria.push(query.criteria)

    if (criteria.length > 0)
      query.criteria = criteria.join(';')
  }
}

class NonQueryableMapping extends Mapping {
  public fit (input: any): Request {
    return { input }
  }
}
