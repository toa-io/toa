import * as http from 'node:http'
import * as https from 'node:https'
import { console } from './Console.ts'

/**
 * One OTLP/HTTP endpoint, and the contract every signal keeps with it: a request bounded by a
 * timeout, a failed body dropped rather than queued, and a single warning per outage.
 *
 * The signals differ in what they send and how often, and not in what an absent backend costs
 * them — so what they share is here, and the batching, the encoding and the flushing stay with
 * whoever exports.
 */
export class Transport {
  private readonly url: string
  private readonly transport: typeof http | typeof https
  private readonly options: http.RequestOptions
  private readonly headers: Record<string, string>
  private readonly subject: string
  private readonly timeout: number
  private readonly cooldown: number
  private suspendedUntil = 0
  private reported = false

  public constructor(url: string, options: TransportOptions) {
    const parsed = new URL(url)

    this.url = parsed.href
    this.transport = parsed.protocol === 'https:' ? https : http
    this.headers = { 'content-type': 'application/json', ...options.headers }
    this.options = {
      method: 'POST',
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      agent: new this.transport.Agent({ keepAlive: true })
    }
    this.subject = options.subject
    this.timeout = options.timeout ?? TIMEOUT
    this.cooldown = options.cooldown ?? COOLDOWN
  }

  public get suspended(): boolean {
    return Date.now() < this.suspendedUntil
  }

  /**
   * Never rejects: a rejection would break the chain whoever called this is holding, and crash
   * the process. A failure suspends the endpoint instead, and says so by its answer.
   */
  public async send(body: string, attributes: object = {}): Promise<boolean> {
    try {
      const status = await this.transmit(body)

      if (status >= 200 && status < 300) {
        this.resume()

        return true
      }

      this.suspend('OTLP export rejected', { status, ...attributes })
    } catch (error) {
      this.suspend('OTLP export failed', error as Error)
    }

    return false
  }

  /**
   * `node:http` rather than `fetch`, as destroying a request releases its socket, while
   * aborting a `fetch` does not: a connection attempt to an unroutable endpoint keeps
   * the process alive until the OS gives up on it, delaying the shutdown.
   */
  private async transmit(body: string): Promise<number> {
    return await new Promise<number>((resolve, reject) => {
      const headers = { ...this.headers, 'content-length': Buffer.byteLength(body) }

      const request = this.transport.request({ ...this.options, headers }, (response) => {
        response.on('error', reject)
        response.on('end', () => resolve(response.statusCode ?? 0))
        response.resume() // the socket is released once the response is consumed
      })

      const timer = setTimeout(
        () => request.destroy(new Error('OTLP request timed out')),
        this.timeout
      )

      timer.unref()

      request.on('error', reject)
      request.on('close', () => clearTimeout(timer))
      request.end(body)
    })
  }

  private suspend(message: string, attributes: Error | object): void {
    this.suspendedUntil = Date.now() + this.cooldown

    if (this.reported) return

    this.reported = true

    console.warn(
      `${message}, ${this.subject} are dropped until the endpoint recovers`,
      attributes
    )
  }

  private resume(): void {
    if (!this.reported) return

    this.reported = false

    console.info('OTLP export recovered', { endpoint: this.url })
  }
}

export interface TransportOptions {
  headers?: Record<string, string>

  /** what is lost while the endpoint is away, named in the warning */
  subject: string

  /** Request timeout in milliseconds, bounds how long a shutdown can wait for the endpoint. */
  timeout?: number

  /** Milliseconds to drop what is sent for after a failure, before trying the endpoint again. */
  cooldown?: number
}

const TIMEOUT = 5000
const COOLDOWN = 30000
