import { type Input, type Output, type Family } from '../../Directive'
import { Control } from './CacheControl'
import { type Directive } from './types'
import type * as http from '../../HTTP'

class Cache implements Family<Directive> {
  public readonly name: string = 'cache'
  public readonly mandatory: boolean = false

  public create (name: string, value: any): Directive {
    const Class = constructors[name]

    if (Class === undefined)
      throw new Error(`Directive '${name}' is not provided by the '${this.name}' family.`)

    return new Class(value)
  }

  public preflight (directives: Directive[], input: Input): Output {
    for (const directive of directives) {
      const output = directive.preProcess?.(input) ?? null

      if (output !== null)
        return output
    }

    return null
  }

  public async settle
  (directives: Directive[], request: Input, response: http.OutgoingMessage): Promise<void> {
    if (response.headers === undefined) response.headers = {}

    for (const directive of directives) {
      const headers = directive.postProcess?.(request, response) ?? {}

      response.headers = { ...response.headers, ...headers }
    }
  }
}

const constructors: Record<string, new (value: any) => Directive> = {
  control: Control
}

export = new Cache()
