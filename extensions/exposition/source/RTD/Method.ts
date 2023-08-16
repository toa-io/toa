import { type Request, type Reply, type Query } from '@toa.io/core'
import { type Endpoint } from './Endpoint'
import { type Parameter } from './Match'
import type * as syntax from './syntax'

export abstract class Method {
  private readonly endpoint: Endpoint

  public constructor (endpoint: Endpoint) {
    this.endpoint = endpoint
  }

  public async call (body: any, query: Query, parameters: Parameter[]): Promise<Reply> {
    const request = this.request(body, query, parameters)

    return await this.endpoint.call(request)
  }

  protected abstract request (body: any, query: Query, parameters: Parameter[]): Request
}

export class InputMethod extends Method {
  protected override request (body: any): Request {
    return { input: body }
  }
}

export class QueryMethod extends Method {
  protected override request (body: any, query: Query, parameters: Parameter[]): Request {
    const criteria: string[] = []

    if (parameters.length > 0) {
      const chunks = parameters
        .map(({ name, value }) => `${name}==${value}`)

      criteria.push(...chunks)
    }

    if (query.criteria !== undefined)
      criteria.push(query.criteria)

    if (criteria.length > 0)
      query.criteria = criteria.join(';')

    return { input: body, query }
  }
}

export type Methods = Map<syntax.Method, Method>
