import { restrict } from '../../Introspection.js'
import { Output } from './Output.js'
import { Input } from './Input.js'
import { Throttle } from './Throttle.js'
import { Status } from './Status.js'
import { Sync } from './lib/throttle/index.js'
import type * as http from '../../HTTP/index.js'
import type { Parameter, DirectiveFamily } from '../../RTD/index.js'
import type { Remotes } from '../../Remotes.js'
import type { Constructor, Directive } from './Directive.js'
import type { Introspection } from '../../Introspection.js'
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

  public precall (directives: Directive[], context: http.Context,
    parameters: Parameter[]): null {
    let restricted = false

    for (const directive of directives) {
      restricted ||= directive instanceof Output

      directive.precall(context, parameters)
    }

    if (!restricted)
      DENIAL.precall(context, parameters)

    return null
  }

  /**
   * What a whitelist admits is what the schema states. Without an `io:output` the reply is
   * dropped before it is sent, so there is no output to describe at all.
   */
  public explain (directives: Directive[], _: http.Context,
    introspection: Introspection): Introspection {
    let restricted = false

    for (const directive of directives) {
      if (directive instanceof Input)
        introspection.input = restrict(introspection.input, directive.allowed)

      if (!(directive instanceof Output))
        continue

      restricted = true

      if (!directive.disabled)
        introspection.output = restrict(introspection.output, directive.allowed)
    }

    if (!restricted)
      delete introspection.output

    return introspection
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
  status: Status,
  throttle: Throttle
}

const DENIAL: Directive = new Output([])
