import { match } from 'matchacho'
import type { AuthenticatedContext, Directive } from './types.ts'

export class Control implements Directive {
  protected readonly value: string

  // a route serves anonymous and authenticated requests alike, and what is set differs
  // between the two, so each is resolved once and kept apart
  private anonymous: Resolution | null = null
  private authenticated: Resolution | null = null

  public constructor(value: string) {
    this.value = value
  }

  public static disabled(headers: Headers): boolean {
    const value = headers.get('cache-control')

    if (value === null) return false

    const directives = mask(value)

    return (directives & NO_STORE) === NO_STORE
  }

  public set(context: AuthenticatedContext, headers: Headers): void {
    if (Control.disabled(headers)) return

    const resolution =
      context.identity === null
        ? (this.anonymous ??= this.resolve(context))
        : (this.authenticated ??= this.resolve(context))

    headers.set('cache-control', resolution.control)

    if (resolution.vary) headers.append('vary', 'authorization')
  }

  protected resolve(request: AuthenticatedContext): Resolution {
    if (request.identity === null) return { control: this.value, vary: false }

    const directives = mask(this.value)
    const vary = (directives & PRIVATE) === PRIVATE

    if ((directives & (PUBLIC | NO_CACHE)) === PUBLIC)
      return { control: 'no-cache, ' + this.value, vary }

    if ((directives & (PUBLIC | PRIVATE)) === 0)
      return { control: 'private, ' + this.value, vary: true }

    return { control: this.value, vary }
  }
}

export interface Resolution {
  control: string
  vary: boolean
}

function mask(value: string): number {
  const directives = value.match(DIRECTIVES_RX)

  if (directives === null) return 0

  let mask = 0

  for (const directive of directives)
    mask |= match<number>(
      directive,
      'private',
      PRIVATE,
      'public',
      PUBLIC,
      'no-cache',
      NO_CACHE,
      'no-store',
      NO_STORE,
      0
    )

  return mask
}

const DIRECTIVES_RX = /\b(private|public|no-cache|no-store)\b/gi

const PUBLIC = 1
const PRIVATE = 2
const NO_CACHE = 4
const NO_STORE = 8
