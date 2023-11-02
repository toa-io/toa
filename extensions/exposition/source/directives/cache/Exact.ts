import { parse } from '@tusbar/cache-control'
import { type PostProcessInput, type Directive } from './types'
import { isSafeMethod } from './utils'

export class Exact implements Directive {
  private readonly value: string

  public constructor (value: string) {
    this.value = parse(value).format()
  }

  public postProcess (request: PostProcessInput): Headers {
    const additionalHeaders: Headers = new Headers()

    if (isSafeMethod(request.method))
      additionalHeaders.set('cache-control', this.value)

    return additionalHeaders
  }
}
