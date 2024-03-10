import assert from 'node:assert'
import { Header, embeddings, Parameter } from './embeddings'
import type { Embedding } from './embeddings'
import type { Input } from '../../io'
import type { Directive } from './Directive'
import type { Properties } from './Properties'
import type * as RTD from '../../RTD'

export class Embed implements Directive {
  private readonly embeddings: Array<[string, Embedding[]]> = []

  public constructor (map: Record<string, string | string[]>) {
    for (const [key, values] of Object.entries(map)) {
      const names = Array.isArray(values) ? values : [values]

      const instances = names.map((name) => {
        if (name[0] === ':')
          return new Header(name.slice(1))

        if (name.slice(0, 2) === '/:')
          return new Parameter(name.slice(2))

        assert.ok(name in embeddings, `Unknown embedding: ${name}`)

        return new embeddings[name]()
      })

      this.embeddings.push([key, instances])
    }
  }

  public preflight (context: Input, properties: Properties, parameters: RTD.Parameter[]): void {
    const values: Record<string, unknown> = {}

    for (const [key, instances] of this.embeddings)
      values[key] = this.resolve(instances, context, properties, parameters)

    context.pipelines.body.push(this.embedding(values))
  }

  // eslint-disable-next-line max-params
  private resolve (instances: Embedding[],
    input: Input,
    properties: Properties,
    parameters: RTD.Parameter[]): unknown {
    let value

    for (const instance of instances) {
      value = instance.resolve(input, properties, parameters)

      if (value !== undefined)
        break
    }

    return value
  }

  private embedding (values: Record<string, unknown>) {
    return (body: unknown): object => {
      if (body === undefined || body === null || typeof body !== 'object')
        return values

      Object.assign(body, values)

      return body
    }
  }
}
