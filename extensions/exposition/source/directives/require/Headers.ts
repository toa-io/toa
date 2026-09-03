import { BadRequest } from '../../HTTP/index.js'
import type { Input } from '../../io.js'
import type { Directive } from './Directive.js'

export class Headers implements Directive {
  private readonly headers: string[]

  public constructor (headers: string[]) {
    if (!Array.isArray(headers))
      headers = [headers]

    this.headers = headers
  }

  public preflight (context: Input): void {
    for (const header of this.headers)
      if (context.request.headers[header] === undefined)
        throw new BadRequest(`Header required: ${header}`)
  }
}
