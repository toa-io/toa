import { type PostProcessInput, type Directive } from './types'
import { isSafeMethod } from './utils'

export class Exact implements Directive {
  private readonly value: string
  private cachedValue: string | null = null

  public constructor (value: string) {
    this.value = value
  }

  public postProcess (request: PostProcessInput, headers: Headers): string {
    if (this.cachedValue !== null) return this.cachedValue

    if (!isSafeMethod(request.method)) {
      this.cachedValue = ''

      return this.cachedValue
    }

    this.cachedValue = this.value

    return this.cachedValue
  }
}
