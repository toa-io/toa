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
    if (parameters.length > 0)
      query.criteria = parameters
        .map(({ name, value }) => `${name}==${value}`)
        .join(';') +
        (query.criteria === undefined ? '' : ';' + query.criteria)

    return { input: body, query }
  }
}

export type Methods = Map<syntax.Method, Method>
