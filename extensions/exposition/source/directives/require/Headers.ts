import { BadRequest } from '../../HTTP'
import type { Input } from '../../io'
import type { Directive } from './Directive'

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
