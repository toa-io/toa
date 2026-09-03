import { Output } from './Output.js'
import { Input } from './Input.js'
import { Throttle } from './Throttle.js'
import { Sync } from './lib/throttle/index.js'
import type * as http from '../../HTTP/index.js'
import type { Parameter, DirectiveFamily } from '../../RTD/index.js'
import type { Remotes } from '../../Remotes.js'
import type { Constructor, Directive } from './Directive.js'
import { ATOM_GROUP } from '../../const.js'
import type { extensions } from '@toa.io/core'

export class IO implements DirectiveFamily<Directive> {
  public readonly name = 'io'
  public readonly mandatory = true

  private host!: extensions.Host

  /** Throttling reconciles through the atom of the gateways, one for every directive. */
  private sync: Sync | null = null

  public mount (host: extensions.Host): void {
    this.host = host
  }

  // eslint-disable-next-line max-params
  public create (name: string, value: unknown, remotes: Remotes, route: string): Directive {
    if (!(name in constructors))
      throw new Error(`Directive 'io:${name}' is not implemented`)

    const Directive = constructors[name]

    Directive.validate(value)

    if (name === 'throttle')
      this.sync ??= new Sync(this.host.atom(ATOM_GROUP))

    return new Directive(value, this.sync!, route)
  }

  public preflight (directives: Directive[], context: http.Context,
    parameters: Parameter[]): null {
    let restricted = false

    for (const directive of directives) {
      restricted ||= directive instanceof Output

      directive.preflight(context, parameters)
    }

    if (!restricted)
      DENIAL.preflight(context, parameters)

    return null
  }

  public settle (directives: Directive[], context: http.Context,
    output: http.OutgoingMessage): void {
    for (const directive of directives)
      directive.settle?.(context, output)
  }

  /**
   * The ticker belongs to the family rather than to any route's directives, and the
   * factory disposes every route it made — so this runs once per route at shutdown,
   * and disposing an already stopped ticker is what makes that harmless.
   */
  public dispose (): void {
    this.sync?.dispose()
  }
}

const constructors: Record<string, Constructor> = {
  input: Input,
  output: Output,
  throttle: Throttle
}

const DENIAL: Directive = new Output([])
