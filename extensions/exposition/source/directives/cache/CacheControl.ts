import { type Output, type Input } from '../../Directive'
import { type OutputHeaders, type Directive } from './types'

const SAFE_METHODS = ['GET', 'OPTIONS', 'HEAD']

export class Control implements Directive {
  private readonly value: string

  public constructor (value: string) {
    this.value = value
  }

  public postProcess (request: Input, response: Output): OutputHeaders {
    const additionalHeaders: Record<string, string> = {}

    if (SAFE_METHODS.includes(request.method))
      additionalHeaders['cache-control'] = this.value

    return additionalHeaders
  }
}
