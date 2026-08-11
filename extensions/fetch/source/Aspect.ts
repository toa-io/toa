import { Connector } from '@toa.io/core'
import { console, type Console, type SpanOptions } from 'openspan'
import type { Locator, extensions } from '@toa.io/core'

export class Aspect extends Connector implements extensions.Aspect {
  public readonly name = 'fetch'
  private readonly locator: Locator
  private readonly consoles: Record<string, Console> = {}

  public constructor (locator: Locator) {
    super()

    this.locator = locator
  }

  public async invoke (operation: string, input: RequestInfo | URL, init?: FetchInit): Promise<Response> {
    const { retry, ...nativeInit } = init ?? {}
    const body = nativeInit.body ?? (input instanceof Request ? input.body : null)

    if (retry !== undefined && retry.attempts > 1 && body instanceof ReadableStream)
      throw new TypeError('Cannot retry a request with a non-replayable body')

    const request = new Request(input, nativeInit)

    const attributes: Record<string, unknown> = {
      'http.request.method': request.method,
      'url.scheme': requestURL(request).protocol.slice(0, -1),
      'server.address': requestURL(request).hostname
    }

    const url = requestURL(request)

    if (url.port !== '') attributes['server.port'] = Number(url.port)

    const options: SpanOptions = {
      name: `${request.method} ${url.origin}`,
      kind: 'internal',
      attributes
    }

    const output = this.output(operation)

    return await output.span(options, async () => {
      const response = await invoke(request, retry, { output, parentAttributes: attributes })

      attributes['http.response.status_code'] = response.status

      return response
    })
  }

  private output (operation: string): Console {
    this.consoles[operation] ??= console.fork({
      namespace: this.locator.namespace,
      component: this.locator.name,
      operation
    })

    return this.consoles[operation]
  }
}

async function invoke (request: Request, options: RetryOptions | undefined,
  telemetry: InvocationTelemetry): Promise<Response> {
  const retry = normalize(options)

  let response: Response | undefined

  for (let attempt = 1; attempt <= retry.attempts; attempt++) {
    telemetry.parentAttributes['retry.attempts'] = attempt

    try {
      response = await send(request, attempt, telemetry)
    } catch (error) {
      await retryError(error, { attempt, options: retry, request })
      continue
    }

    if (expected(response.status, retry.expected) || attempt === retry.attempts)
      return response

    const interval = retryAfter(response.headers.get('retry-after')) ?? delay(retry, attempt)

    await discard(response)
    await wait(interval, request.signal)
  }

  return response!
}

async function send (request: Request, attempt: number, telemetry: InvocationTelemetry): Promise<Response> {
  const attributes: Record<string, unknown> = {
    ...telemetry.parentAttributes,
    'retry.attempt': attempt
  }

  delete attributes['retry.attempts']

  return await telemetry.output.span({
    name: `attempt ${attempt}`,
    kind: 'client',
    attributes
  }, async () => {
    const response = await globalThis.fetch(request.clone())

    attributes['http.response.status_code'] = response.status

    return response
  })
}

async function retryError (error: unknown, parameters: RetryErrorParameters): Promise<void> {
  const { attempt, options, request } = parameters

  if (attempt === options.attempts || request.signal.aborted) throw error

  await wait(delay(options, attempt), request.signal)
}

async function discard (response: Response): Promise<void> {
  try {
    await response.body?.cancel()
  } catch {
    // The response is discarded regardless of whether its stream closes cleanly.
  }
}

function normalize (options?: RetryOptions): NormalizedRetryOptions {
  if (options === undefined)
    return { attempts: 1, expected: undefined, delay: DEFAULT_DELAY, factor: DEFAULT_FACTOR }

  if (!Number.isInteger(options.attempts) || options.attempts < 1)
    throw new TypeError('retry.attempts must be an integer greater than or equal to 1')

  if (options.expected !== undefined &&
    (options.expected.length === 0 || options.expected.some((status) =>
      !Number.isInteger(status) || status < 100 || status > 599)))
    throw new TypeError('retry.expected must contain HTTP status codes')

  if (options.delay !== undefined && (!Number.isFinite(options.delay) || options.delay < 0))
    throw new TypeError('retry.delay must be a non-negative number')

  if (options.factor !== undefined && (!Number.isFinite(options.factor) || options.factor < 0))
    throw new TypeError('retry.factor must be a non-negative number')

  return {
    attempts: options.attempts,
    expected: options.expected,
    delay: options.delay ?? DEFAULT_DELAY,
    factor: options.factor ?? DEFAULT_FACTOR
  }
}

function expected (status: number, statuses?: number[]): boolean {
  return statuses === undefined ? status >= 200 && status < 300 : statuses.includes(status)
}

function delay (options: NormalizedRetryOptions, attempt: number): number {
  return options.delay * Math.pow(options.factor, attempt - 1)
}

function retryAfter (value: string | null): number | undefined {
  if (value === null) return undefined

  const seconds = Number(value)

  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000

  const date = Date.parse(value)

  if (Number.isNaN(date)) return undefined

  return Math.max(0, date - Date.now())
}

async function wait (milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) throw signal.reason

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(done, milliseconds)

    signal.addEventListener('abort', aborted, { once: true })

    function done (): void {
      signal.removeEventListener('abort', aborted)
      resolve()
    }

    function aborted (): void {
      clearTimeout(timeout)
      reject(signal.reason)
    }
  })
}

function requestURL (request: Request): URL {
  return new URL(request.url)
}

export interface FetchInit extends RequestInit {
  retry?: RetryOptions
}

export interface RetryOptions {
  attempts: number
  expected?: number[]
  delay?: number
  factor?: number
}

interface NormalizedRetryOptions {
  attempts: number
  expected?: number[]
  delay: number
  factor: number
}

interface RetryErrorParameters {
  attempt: number
  options: NormalizedRetryOptions
  request: Request
}

interface InvocationTelemetry {
  output: Console
  parentAttributes: Record<string, unknown>
}

const DEFAULT_DELAY = 100
const DEFAULT_FACTOR = 2
