import type { Input, Output } from './io'

export class Interception implements Interceptor {
  private readonly interceptors: Interceptor[]

  public constructor (interceptors: Interceptor[]) {
    this.interceptors = interceptors

    // interceptors are module singletons, so a second gateway in one process —
    // which is how the features run — would otherwise inherit the first one's state
    for (const interceptor of interceptors)
      interceptor.reset?.()
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
}
