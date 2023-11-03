import { type PostProcessInput, type Directive } from './types'
import { isSafeMethod, parseCacheControlFlags } from './utils'

export class Control implements Directive {
  private readonly value: string
  private readonly isPublic: boolean
  private readonly isPrivate: boolean
  private readonly isNoCache: boolean
  private cachedValue: string | null = null

  public constructor (value: string) {
    this.value = value
    const flagMap = parseCacheControlFlags(value)

    this.isPublic = flagMap.public
    this.isPrivate = flagMap.private
    this.isNoCache = flagMap['no-cache']
  }

  public postProcess (request: PostProcessInput, headers: Headers): string {
    if (this.cachedValue !== null) return this.cachedValue

    if (!isSafeMethod(request.method)) {
      this.cachedValue = ''

      return this.cachedValue
    }

    this.cachedValue = this.value

    if (request.identity !== null && this.isPublic && !this.isNoCache)
      this.cachedValue += ', no-cache'

    if (request.identity !== null && !this.isPublic && !this.isPrivate)
      this.cachedValue += ', private'

    return this.cachedValue
  }
}
