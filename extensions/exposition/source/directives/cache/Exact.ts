import { type PostProcessInput, type Directive, type CacheHeader } from './types'
import { isSafeMethod } from './utils'

export class Exact implements Directive {
  private readonly value: string
  private readonly cached: CacheHeader

  public constructor (value: string) {
    this.value = value
    this.cached = {
      initiated: false,
      key: 'cache-control',
      value: ''
    }
  }

  public settle (request: PostProcessInput): CacheHeader {
    if (this.cached.initiated) return this.cached

    this.cached.initiated = true

    if (!isSafeMethod(request.method)) return this.cached

    this.cached.value = this.value

    return this.cached
  }
}
