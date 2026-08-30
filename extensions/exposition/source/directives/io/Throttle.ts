import { TooManyRequests } from '../../HTTP'
import * as schemas from './schemas'
import { parse, Quotas, type Declaration } from './lib/throttle'
import type { Remote } from '@toa.io/core'
import type * as http from '../../HTTP'
import type { Parameter } from '../../RTD'
import type { Directive } from './Directive'

export class Throttle implements Directive {
  private readonly quotas: Quotas

  public constructor (declaration: Declaration, counter: Promise<Remote>, route: string) {
    const configuration = parse(declaration)

    this.quotas = Quotas.create(configuration, counter, route)
  }

  public static validate (declaration: unknown): asserts declaration is Declaration {
    schemas.throttle.validate(declaration, 'Incorrect \'io:throttle\' format')
  }

  public preflight (context: http.Context, parameters: Parameter[]): void {
    if (!this.quotas.ok(context, parameters))
      throw new TooManyRequests()
  }

  public async settle (context: http.Context, output: http.OutgoingMessage): Promise<void> {
    await this.quotas.use(context, output)
  }

  public dispose (): void {
    this.quotas.dispose()
  }
}
