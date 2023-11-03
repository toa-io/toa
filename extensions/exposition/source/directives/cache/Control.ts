import { parse } from '@tusbar/cache-control'
import { type PostProcessInput, type Directive } from './types'
import { isSafeMethod } from './utils'

export class Control implements Directive {
  private readonly value: string
  private readonly isPublic: boolean
  private readonly isPrivate: boolean
  private readonly isNoCache: boolean

  public constructor (value: string) {
    const parsedValue = parse(value)

    this.value = parsedValue.format()

    this.isPublic = parsedValue.public === true
    this.isPrivate = parsedValue.private === true
    this.isNoCache = parsedValue.noCache === true
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
