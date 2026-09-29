import { it } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { decode, encode } from './answers.ts'

const kept = async (answer: unknown): Promise<unknown> =>
  decode(JSON.parse(JSON.stringify(await encode(answer))))

it('should give back a value', async () => {
  assert.deepStrictEqual(await kept({ a: [1, 'two', null] }), { a: [1, 'two', null] })
  assert.equal(await kept(7), 7)
  assert.equal(await kept(null), null)
})

it('should give back nothing', async () => {
  assert.equal(await kept(undefined), undefined)
})

it('should give back bytes', async () => {
  assert.deepStrictEqual(await kept(Buffer.from('bytes')), Buffer.from('bytes'))
})

it('should give back a declared error', async () => {
  const error = Object.assign(new Error(), { code: 'NOT_FOUND', message: 'none' })
  const back = (await kept(error)) as Error & { code: string }

  assert.ok(back instanceof Error)
  assert.equal(back.code, 'NOT_FOUND')
  assert.equal(back.message, 'none')
})

it('should give back a response whole', async () => {
  const response = new Response('{"attempt":1}', {
    status: 201,
    statusText: 'Created',
    headers: { 'content-type': 'application/json' }
  })

  const back = (await kept(response)) as Response

  assert.equal(back.status, 201)
  assert.equal(back.statusText, 'Created')
  assert.equal(back.headers.get('content-type'), 'application/json')
  assert.deepStrictEqual(await back.json(), { attempt: 1 })
})

it('should give back a response without a body', async () => {
  const back = (await kept(new Response(null, { status: 204 }))) as Response

  assert.equal(back.status, 204)
  assert.equal(back.body, null)
})

it('should refuse a stream', async () => {
  await assert.rejects(encode(Readable.from([1, 2])), { code: 603 })
  await assert.rejects(encode(new ReadableStream()), { code: 603 })
  await assert.rejects(encode((async function* () {})()), { code: 603 })
})
