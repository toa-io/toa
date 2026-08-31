import { TooManyRequests } from '../../HTTP'
import * as schemas from './schemas'
import { parse, Quotas, type Declaration, type Sync } from './lib/throttle'
import type * as http from '../../HTTP'
import type { Parameter } from '../../RTD'
import type { Directive } from './Directive'

export class Throttle implements Directive {
  private readonly quotas: Quotas

  public constructor (declaration: Declaration, sync: Sync, route: string) {
    this.quotas = Quotas.create(parse(declaration), route)

    sync.register(this.quotas)
  }

  public static validate (declaration: unknown): asserts declaration is Declaration {
    schemas.throttle.validate(declaration, 'Incorrect \'io:throttle\' format')
  }

  public preflight (context: http.Context, parameters: Parameter[]): void {
    const retry = this.quotas.check(context, parameters)

    if (retry > 0)
      throw new TooManyRequests(retry)
  }

  public settle (context: http.Context, output: http.OutgoingMessage): void {
    this.quotas.use(context, output)
  }
}
