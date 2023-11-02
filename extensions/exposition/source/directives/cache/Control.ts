import { type Output, type Input } from '../../Directive'
import { type OutputHeaders, type Directive } from './types'
import { isSafeMethod } from './utils'

export class Control implements Directive {
  private readonly value: string

  public constructor (value: string) {
    this.value = value
  }

  public postProcess (request: Input, response: Output): OutputHeaders {
    const additionalHeaders: Record<string, string> = {}

    if (isSafeMethod(request.method))
      additionalHeaders['cache-control'] = this.value

    return additionalHeaders
  }
}
