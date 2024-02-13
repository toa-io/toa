import assert from 'node:assert'
import { Header, embeddings } from './embeddings'
import type { Embedding } from './embeddings'
import type { Input } from '../../io'
import type { Directive } from './Directive'
import type { Properties } from './Properties'

export class Embed implements Directive {
  private readonly embeddings: Array<[string, Embedding[]]> = []

  public constructor (map: Record<string, string | string[]>) {
    for (const [key, values] of Object.entries(map)) {
      const names = Array.isArray(values) ? values : [values]

      const instances = names.map((name) => {
        if (name[0] === ':')
          return new Header(name.slice(1))

        assert.ok(name in embeddings, `Unknown embedding: ${name}`)

        return new embeddings[name]()
      })

      this.embeddings.push([key, instances])
    }
  }

  public preflight (input: Input, properties: Properties): void {
    const values: Record<string, unknown> = {}

    for (const [key, instances] of this.embeddings)
      values[key] = this.resolve(instances, input, properties)

    input.pipelines.body.push(this.embedding(values))
  }

  private resolve (instances: Embedding[], input: Input, properties: Properties): unknown {
    let value

    for (const instance of instances) {
      value = instance.resolve(input, properties)

      if (value !== undefined)
        break
    }

    assert.ok(value !== undefined, 'Neither embedding resolved a value.')

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
