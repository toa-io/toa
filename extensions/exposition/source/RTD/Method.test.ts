import { it, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Method } from './Method.ts'
import type { Endpoint } from './Endpoint.ts'
import type { Directives } from './Directives.ts'
import type { Context } from '../HTTP/index.ts'
import type { Introspection } from '../Introspection.ts'

const context = {} as unknown as Context

const endpoint = (): Endpoint =>
  ({
    explain: mock.fn(async () => ({ description: 'a pot' }) as Introspection)
  }) as unknown as Endpoint

const directives = (admits: boolean): Directives =>
  ({
    admits: mock.fn(async () => admits),
    describe: (introspection: Introspection) => introspection
  }) as unknown as Directives

it('should describe the method once, for every caller', async () => {
  const described = endpoint()
  const method = new Method(described, directives(true))

  const one = await method.explain(context, [])
  const other = await method.explain(context, [])

  // the same object: what is described is the route's and not the caller's, and whoever
  // reads it leaves it as it is
  assert.strictEqual(one, other)
  assert.strictEqual((described.explain as ReturnType<typeof mock.fn>).mock.calls.length, 1)
})

it('should answer nothing where the directives refuse the caller', async () => {
  const described = endpoint()
  const method = new Method(described, directives(false))

  assert.strictEqual(await method.explain(context, []), null)

  // a method this caller is not told of is not described at all
  assert.strictEqual((described.explain as ReturnType<typeof mock.fn>).mock.calls.length, 0)
})
