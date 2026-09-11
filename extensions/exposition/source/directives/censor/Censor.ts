import * as http from '../../HTTP/index.js'
import type { Input, Output } from '../../io.js'
import type { Interceptor } from '../../Interception.js'

export class Censor implements Interceptor {
  public readonly name = 'censor'

  private header: string | null = null
  private values = new Set<string>()

  public mount(options: http.Options): void {
    // header names arrive lower-cased, so one declared in any other case would never match
    this.header = options.censor?.header.toLowerCase() ?? null
    this.values = new Set(options.censor?.values)
  }

  public intercept(input: Input): Output {
    if (this.header === null) return null

    const value = input.request.headers[this.header]

    if (typeof value === 'string' && this.values.has(value))
      throw new http.UnavailableForLegalReasons()

    return null
  }
}
