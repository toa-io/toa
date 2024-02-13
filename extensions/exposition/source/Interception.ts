import type { Input, Output } from './io'

export class Interception implements Interceptor {
  private readonly interceptors: Interceptor[]

  public constructor (interceptors: Interceptor[]) {
    this.interceptors = interceptors
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
}
