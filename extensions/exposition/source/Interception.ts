import type * as http from './HTTP/index.js'
import type { Input, Output } from './io.js'

export class Interception implements Interceptor {
  private readonly interceptors: Interceptor[]

  public constructor (interceptors: Interceptor[], options: http.Options) {
    this.interceptors = interceptors

    // interceptors are module singletons, so a second gateway in one process —
    // which is how the features run — would otherwise inherit the first one's state
    for (const interceptor of interceptors) {
      interceptor.reset?.()
      interceptor.mount?.(options)
    }
  }

  public async intercept (input: Input): Promise<Output> {
    for (const interceptor of this.interceptors) {
      const output = await interceptor.intercept(input)

      if (output !== null)
        return output
    }

    return null
  }
}

export interface Interceptor {
  intercept: (input: Input) => Output | Promise<Output>

  /** Discards whatever the interceptor accumulated while serving. */
  reset?: () => void

  /** What the annotation says, for an interceptor that answers from it. */
  mount?: (options: http.Options) => void
}
