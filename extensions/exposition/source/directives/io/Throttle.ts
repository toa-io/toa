import { TooManyRequests } from '../../HTTP/index.js'
import * as schemas from './schemas.js'
import { parse, Quotas, type Declaration, type Sync } from './lib/throttle/index.js'
import type * as http from '../../HTTP/index.js'
import type { Parameter } from '../../RTD/index.js'
import type { Directive } from './Directive.js'

export class Throttle implements Directive {
  private readonly quotas: Quotas

  public constructor (declaration: Declaration, sync: Sync, route: string) {
    this.quotas = Quotas.create(parse(declaration), route)

    sync.register(this.quotas)
  }

  public static validate (declaration: unknown): asserts declaration is Declaration {
    schemas.throttle.validate(declaration, 'Incorrect \'io:throttle\' format')
  }

  public precall (context: http.Context, parameters: Parameter[]): void {
    const retry = this.quotas.check(context, parameters)

    if (retry > 0)
      throw new TooManyRequests(retry)
  }

  public settle (context: http.Context, output: http.OutgoingMessage): void {
    this.quotas.use(context, output)
  }
}
