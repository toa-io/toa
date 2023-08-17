import { type Reply } from '@toa.io/core'
import { type HTTPQuery } from '../HTTP'
import { type Mapping } from './Mapping'
import { type Endpoint } from './Endpoint'
import { type Parameter } from './Match'
import type * as syntax from './syntax'

export class Method {
  private readonly endpoint: Endpoint
  private readonly mapping: Mapping

  public constructor (endpoint: Endpoint, mapping: Mapping) {
    this.endpoint = endpoint
    this.mapping = mapping
  }

  public async call (body: any, query: HTTPQuery, parameters: Parameter[]): Promise<Reply> {
    const request = this.mapping.fit(body, query, parameters)

    return await this.endpoint.call(request)
  }
}

export type Methods = Map<syntax.Method, Method>
