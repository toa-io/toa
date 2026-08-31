import { Output } from './Output'
import { Input } from './Input'
import { Throttle } from './Throttle'
import { Sync } from './lib/throttle'
import type * as http from '../../HTTP'
import type { Parameter, DirectiveFamily } from '../../RTD'
import type { Remotes } from '../../Remotes'
import type { Constructor, Directive } from './Directive'

export class IO implements DirectiveFamily<Directive> {
  public readonly name = 'io'
  public readonly mandatory = true

  /** Throttling reconciles through a component, because only a component has a stash aspect. */
  private sync: Sync | null = null

  // eslint-disable-next-line max-params
  public create (name: string, value: unknown, remotes: Remotes, route: string): Directive {
    if (!(name in constructors))
      throw new Error(`Directive 'io:${name}' is not implemented`)

    const Directive = constructors[name]

    Directive.validate(value)

    // discovering boots the component, so nothing is discovered until something throttles
    if (name === 'throttle')
      this.sync ??= new Sync(remotes.discover('exposition', 'stash'))

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
