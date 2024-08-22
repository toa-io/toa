import { once } from 'node:events'
import * as assert from 'node:assert'
import { Readable } from 'node:stream'
import { console } from 'openspan'
import type { Directive } from './types'
import type { Input as Context } from '../../io'
import type { OutgoingMessage } from '../../HTTP'

export class Compose implements Directive {
  private readonly expression: Expression

  public constructor (composition: any) {
    this.expression = compile(composition as object)
  }

  public attach (context: Context): void {
    context.pipelines.response.push(async (message: OutgoingMessage) => {
      if (!(message.body instanceof Readable)) {
        console.warn('Response body is not a stream, skipping composition')

        return
      }

      assert.ok(message.body instanceof Readable, 'Response body is not a stream')

      // @ts-expect-error -- objectMode is not defined in the type definition
      assert.ok(message.body._readableState.objectMode, 'Response stream is not in object mode')

      const $ = await this.compose(message.body)

      message.body = this.expression($)
    })
  }

  private async compose (stream: Readable): Promise<unknown[]> {
    const $: unknown[] = []

    stream.on('data', (data) => $.push(data))

    await once(stream, 'end')

    return $
  }
}

function compile (composition: object): Expression {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval,no-new-func
  return new Function('$', `return ${json(composition)}`) as Expression
}

function json (node: object | string): string {
  if (typeof node === 'string')
    if (node.startsWith('\\'))
      return `"${node}"`
    else
      return node

  if (Array.isArray(node))
    return `[${node.map((v) => json(v)).join(',')}]`

  if (node.constructor !== Object)
    return JSON.stringify(node)

  return '{' + Object.entries(node)
    .map(([key, value]) => `"${key}": ${json(value as object | string)}`).join(',') + '}'
}

type Expression = ($: unknown[]) => unknown
