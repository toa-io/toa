import { type PostProcessInput, type Directive, type CacheHeader } from './types'
import { isSafeMethod, parseCacheControlFlags } from './utils'

export class Control implements Directive {
  private readonly value: string
  private readonly isPublic: boolean
  private readonly isPrivate: boolean
  private readonly isNoCache: boolean
  private readonly cached: CacheHeader

  public constructor (value: string) {
    this.value = value
    this.cached = {
      initiated: false,
      key: 'cache-control',
      value: ''
    }
    const flagMap = parseCacheControlFlags(value)

    this.isPublic = flagMap.public
    this.isPrivate = flagMap.private
    this.isNoCache = flagMap['no-cache']
  }

  public settle (request: PostProcessInput): CacheHeader {
    if (this.cached.initiated) return this.cached

    this.cached.initiated = true

    if (!isSafeMethod(request.method)) return this.cached

    this.cached.value = this.value

    if (request.identity !== null && this.isPublic && !this.isNoCache)
      this.cached.value += ', no-cache'

    if (this.value !== '' && request.identity !== null && !this.isPublic && !this.isPrivate)
      this.cached.value += ', private'

    return this.cached
  }
}
