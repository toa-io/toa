import { match } from 'matchacho'
import type { AuthenticatedRequest, Directive } from './types'

export class Control implements Directive {
  protected readonly value: string
  private cache: string | null = null

  public constructor (value: string) {
    this.value = value
  }

  public set (request: AuthenticatedRequest, headers: Headers): void {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method))
      return

    this.cache ??= this.resolve(request)

    headers.set('cache-control', this.cache)
  }

  protected resolve (request: AuthenticatedRequest): string {
    if (request.identity === null)
      return this.value

    const directives = this.parse()

    if ((directives & (PUBLIC | NO_CACHE)) === PUBLIC)
      return 'no-cache, ' + this.value

    if ((directives & (PUBLIC | PRIVATE)) === 0)
      return 'private, ' + this.value

    return this.value
  }

  private parse (): number {
    const found = this.value.match(DIRECTIVES_RX)

    if (found === null)
      return 0

    let directives = 0

    for (const directive of found)
      directives |= match<number>(directive,
        'private', PRIVATE,
        'public', PUBLIC,
        'no-cache', NO_CACHE,
        0)

    return directives
  }
}

const DIRECTIVES_RX = /\b(private|public|no-cache)\b/ig

const PUBLIC = 1
const PRIVATE = 2
const NO_CACHE = 4
