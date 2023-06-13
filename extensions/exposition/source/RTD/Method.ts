import { type Endpoint } from './Endpoint'
import type * as syntax from './syntax'
import type { Request, Reply } from '@toa.io/core'

export abstract class Method {
  private readonly endpoint: Endpoint

  protected constructor (endpoint: Endpoint) {
    this.endpoint = endpoint
  }

  public static create (method: syntax.Method, endpoint: Endpoint): Method {
    const Class = method === 'POST' ? InputMethod : QueryMethod

    return new Class(endpoint)
  }

  public async call (body: any, params: Record<string, string>): Promise<Reply> {
    const request = this.request(body, params)

    return await this.endpoint.call(request)
  }

  protected abstract request (body: any, params: Record<string, string>): Request
}

class InputMethod extends Method {
  protected override request (body: any, params: Record<string, string>): Request {
    return {}
  }
}

class QueryMethod extends Method {
  protected override request (body: any, params: Record<string, string>): Request {
    return {}
  }
}
