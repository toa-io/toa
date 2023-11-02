import { type Input, type Output, type Family } from '../../Directive'
import { Control } from './Control'
import { type Directive } from './types'
import { Exact } from './Exact'
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
    return null
  }

  public async settle
  (directives: Directive[], request: Input, response: http.OutgoingMessage): Promise<void> {
    const respHeaders: Headers = Object.entries(response.headers ?? {})
      .reduce((acc, [key, value]) => {
        if (value !== undefined) acc.append(key, value.toString())

        return acc
      }, new Headers())

    for (const directive of directives) {
      const headers = directive.postProcess?.(request, response) ?? new Headers()

      headers.forEach((value, key) => respHeaders.append(key, value))
    }

    response.headers = Object.fromEntries(respHeaders.entries())
  }
}

const constructors: Record<string, new (value: any) => Directive> = {
  control: Control,
  exact: Exact
}

export = new Cache()
