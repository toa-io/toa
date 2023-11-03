import { type PostProcessInput, type Directive } from './types'
import { isSafeMethod, parseCacheControlFlags } from './utils'

export class Control implements Directive {
  private readonly value: string
  private readonly isPublic: boolean
  private readonly isPrivate: boolean
  private readonly isNoCache: boolean

  public constructor (value: string) {
    this.value = value
    const flagMap = parseCacheControlFlags(value)

    this.isPublic = flagMap.public
    this.isPrivate = flagMap.private
    this.isNoCache = flagMap['no-cache']
  }

  public postProcess (request: PostProcessInput, headers: Headers): void {
    if (!isSafeMethod(request.method)) return

    headers.append('cache-control', this.value)

    if (request.identity !== null && this.isPublic && !this.isNoCache)
      headers.append('cache-control', 'no-cache')

    if (request.identity !== null && !this.isPublic && !this.isPrivate)
      headers.append('cache-control', 'private')
  }
}
