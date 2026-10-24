import * as http from '../../HTTP/index.ts'
import type { Input, Output } from '../../io.ts'
import type { Interceptor } from '../../Interception.ts'

export class Censor implements Interceptor {
  public readonly name = 'censor'

  private countries = new Set<string>()

  public mount(options: http.Options): void {
    this.countries = new Set(options.censor)
  }

  /** The country is the request's, as `exposition.country` reads it; a request of none is served. */
  public intercept(input: Input): Output {
    if (input.country !== undefined && this.countries.has(input.country))
      throw new http.UnavailableForLegalReasons()

    return null
  }
}
