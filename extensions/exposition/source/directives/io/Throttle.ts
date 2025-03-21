import { TooManyRequests } from '../../HTTP'
import * as schemas from './schemas'
import { parse, Quotas, type Declaration } from './lib/throttle'
import type * as http from '../../HTTP'
import type { Directive } from './Directive'

export class Throttle implements Directive {
  private readonly quotas: Quotas

  public constructor (declaration: Declaration) {
    const configuration = parse(declaration)

    this.quotas = Quotas.create(configuration)
  }

  public static validate (declaration: unknown): asserts declaration is Declaration {
    schemas.throttle.validate(declaration, 'Incorrect \'io:throttle\' format')
  }

  public preflight (context: http.Context): void {
    if (!this.quotas.ok(context))
      throw new TooManyRequests()
  }

  public settle (context: http.Context, output: http.OutgoingMessage): void {
    this.quotas.use(context, output)
  }

  public dispose (): void {
    this.quotas.dispose()
  }
}
