import { type Input } from '../../Directive'
import { type Directive } from './types'
import { isSafeMethod } from './utils'

export class Control implements Directive {
  private readonly value: string

  public constructor (value: string) {
    this.value = value
  }

  public postProcess (request: Input): Headers {
    const additionalHeaders: Headers = new Headers()

    if (isSafeMethod(request.method))
      additionalHeaders.set('cache-control', this.value)

    return additionalHeaders
  }
}
