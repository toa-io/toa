import { type Request, type Reply } from '@toa.io/core'
import { type ParsedQs } from 'qs'
import { type Endpoint } from './Endpoint'
import type * as syntax from './syntax'

export abstract class Method {
  private readonly endpoint: Endpoint

  public constructor (endpoint: Endpoint) {
    this.endpoint = endpoint
  }

  public async call (body: any, query: ParsedQs): Promise<Reply> {
    const request = this.request(body, query)

    return await this.endpoint.call(request)
  }

  protected abstract request (body: any, query: ParsedQs): Request
}

export class InputMethod extends Method {
  protected override request (body: any, query: ParsedQs): Request {
    return { input: body }
  }
}

export class QueryMethod extends Method {
  protected override request (body: any, query: ParsedQs): Request {
    return { query }
  }
}

export type Methods = Map<syntax.Method, Method>
