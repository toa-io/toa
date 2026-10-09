import { console } from 'openspan'
import { Connector } from '@toa.io/core'

/** An icon a client may render, as the revision describes one. */
export interface Icon {
  src: string
  mimeType?: string
  sizes?: string[]
}

/**
 * The icons of an application's web manifest, read in the background. A request never waits
 * for a read: what it is answered with is what the last read that did not fail gave, and none
 * before one has.
 *
 * Every replica reads for itself — a document this small is not worth sharing state for — and
 * reads again on the cycle a client holds `server/discover` for, so what a client was shown is
 * at most two cycles old. HTTP caching is not honoured: the cycle replaces it.
 */
export class Manifest extends Connector {
  private readonly url: string
  private readonly shown: (icons: Icon[]) => void
  private readonly fetch: typeof globalThis.fetch

  /** What was last shown, to tell a change from a read that found the same. */
  private current: string | null = null

  /** Consecutive reads that failed, which is what the retry backs off by. */
  private failures = 0

  private timer: ReturnType<typeof setTimeout> | null = null
  private aborted = new AbortController()

  public constructor(
    url: string,
    shown: (icons: Icon[]) => void,
    fetch: typeof globalThis.fetch = globalThis.fetch
  ) {
    super()

    this.url = url
    this.shown = shown
    this.fetch = fetch
  }

  protected override open(): void {
    this.aborted = new AbortController()

    // the endpoint answers without icons meanwhile: a site of another origin is not one to wait for
    void this.read()
  }

  protected override close(): void {
    if (this.timer !== null) clearTimeout(this.timer)

    this.timer = null
    this.aborted.abort()
  }

  private async read(): Promise<void> {
    const document = await this.get()

    if (this.aborted.signal.aborted) return

    if (document instanceof Error) this.failed(document)
    else this.succeeded(icons(document, this.url))

    this.schedule()
  }

  private async get(): Promise<unknown> {
    try {
      const response = await this.fetch(this.url, {
        // a redirect leaves the address the annotation names
        redirect: 'error',
        signal: AbortSignal.any([this.aborted.signal, AbortSignal.timeout(TIMEOUT)]),
        headers: { accept: 'application/manifest+json, application/json' }
      })

      if (!response.ok)
        return new Error(`The manifest is answered with ${response.status}`)

      return JSON.parse(await capped(response))
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error))
    }
  }

  private succeeded(found: Icon[]): void {
    if (this.failures > 0)
      console.info('The web manifest is read again', { url: this.url })

    this.failures = 0

    const value = JSON.stringify(found)

    if (value === this.current) return

    if (found.length === 0)
      console.warn('The web manifest lists no icon to show', { url: this.url })

    this.current = value
    this.shown(found)
  }

  private failed(error: Error): void {
    this.failures++

    const attributes = { url: this.url, message: error.message }

    // a site that is down is said once, and not every time it is still down
    if (this.failures === 1) console.warn('The web manifest is not read', attributes)
    else console.debug('The web manifest is still not read', attributes)
  }

  private schedule(): void {
    // until a read succeeds, sooner; the icons of the last that did are kept meanwhile
    const delay =
      this.failures === 0 || this.current !== null
        ? CYCLE
        : Math.min(RETRY * 2 ** (this.failures - 1), CYCLE)

    this.timer = setTimeout(() => void this.read(), delay)
    this.timer.unref?.()
  }
}

/**
 * What a client may render of a manifest's icons with no further trust: one of the manifest's
 * own origin, meant to be shown as it is, and an image where it says what it is.
 */
export function icons(document: unknown, url: string): Icon[] {
  const listed = (document as { icons?: unknown } | null)?.icons

  if (!Array.isArray(listed)) return []

  const origin = new URL(url).origin
  const found: Icon[] = []

  for (const item of listed) {
    if (typeof item !== 'object' || item === null) continue

    const { src, type, sizes, purpose } = item as Record<string, unknown>

    if (typeof src !== 'string' || src === '') continue

    const resolved = URL.parse(src, url)

    if (resolved === null || resolved.origin !== origin) continue

    if (
      purpose !== undefined &&
      !(typeof purpose === 'string' && words(purpose).includes('any'))
    )
      continue

    if (type !== undefined && !(typeof type === 'string' && type.startsWith('image/')))
      continue

    const icon: Icon = { src: resolved.href }

    if (type !== undefined) icon.mimeType = type

    const valid = typeof sizes === 'string' ? words(sizes).map(lower).filter(size) : []

    if (valid.length > 0) icon.sizes = valid

    found.push(icon)
  }

  return found
}

/** The body, not read past the cap: a document no manifest is this large is no manifest. */
async function capped(response: Response): Promise<string> {
  const reader = response.body?.getReader()

  if (reader === undefined) return ''

  const chunks: Uint8Array[] = []
  let length = 0

  for (;;) {
    const { done, value } = await reader.read()

    if (done) break

    length += value.byteLength

    if (length > SIZE) {
      await reader.cancel()

      throw new Error(`The manifest is over ${SIZE} bytes`)
    }

    chunks.push(value)
  }

  return Buffer.concat(chunks).toString('utf8')
}

function words(value: string): string[] {
  return value.split(/\s+/).filter((word) => word !== '')
}

function lower(value: string): string {
  return value.toLowerCase()
}

function size(value: string): boolean {
  return value === 'any' || /^[1-9]\d*x[1-9]\d*$/.test(value)
}

/** How often the manifest is read: the time a client may hold `server/discover`. */
const CYCLE = 30 * 60_000

/** The first retry after a read failed, doubled until it is a cycle. */
const RETRY = 60_000

const TIMEOUT = 3_000
const SIZE = 16 * 1024
