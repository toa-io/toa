import { BadRequest } from '../../HTTP/index.ts'
import type { Input } from '../../io.ts'
import type { Directive } from './Directive.ts'

export class Headers implements Directive {
  private readonly headers: string[]

  public constructor(headers: string[]) {
    if (!Array.isArray(headers)) headers = [headers]

    this.headers = headers
  }

  public precall(context: Input): void {
    for (const header of this.headers)
      if (context.request.headers[header] === undefined)
        throw new BadRequest(`Header required: ${header}`)
  }
}
