import { Mapping } from './Mapping.ts'
import type { Input } from '../../io.ts'

/**
 * What the gateway resolved of the client — its address, its country — as `exposition.ip` and
 * `exposition.country` read them. Set whether the request has one or not, as `null` where it has
 * none, so a body cannot say it for the client.
 */
abstract class Resolved extends Mapping<string> {
  protected constructor(property: string, directive: string) {
    if (typeof property !== 'string') throw new Error(`\`${directive}\` must be a string`)

    super(property)
  }

  public properties(context: Input): Record<string, string | null> {
    return { [this.value]: this.read(context) ?? null }
  }

  protected abstract read(context: Input): string | undefined
}

export class IP extends Resolved {
  public constructor(property: string) {
    super(property, 'map:ip')
  }

  protected read(context: Input): string | undefined {
    return context.ip
  }
}

export class Country extends Resolved {
  public constructor(property: string) {
    super(property, 'map:country')
  }

  protected read(context: Input): string | undefined {
    return context.country
  }
}
