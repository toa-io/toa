import { cors } from '../../cors'
import type { Input } from '../../../io'
import type { Embedding } from './Embedding'

export class Header implements Embedding {
  private readonly name: string

  public constructor (name: string) {
    this.name = name

    cors.allow(this.name)
  }

  public resolve (input: Input): string | undefined {
    const value = input.request.headers[this.name]

    if (value === undefined)
      return value

    input.pipelines.response.push((response) => {
      response.headers ??= new Headers()
      response.headers.append('vary', this.name)
    })

    if (Array.isArray(value))
      return value.join(', ')
    else
      return value
  }
}
