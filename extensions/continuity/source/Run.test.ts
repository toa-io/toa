import { it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { trail } from '@toa.io/core'
import { Run } from './Run.ts'
import type { Journal } from './Journal.ts'
import type { Kept } from './answers.ts'

/** a journal holding what `records` holds, and keeping what it is given unless it has it */
function journal(records = new Map<string, Kept>()) {
  return {
    records,
    recall: mock.fn(async () => ({ steps: new Map(records), expires: undefined })),
    record: mock.fn(async (_run: string, key: string, answer: Kept) => {
      if (!records.has(key)) records.set(key, answer)

      return records.get(key)!
    })
  }
}

/** one attempt of `id`, with `attempt` run as its invocation */
async function attempt<T>(
  id: string,
  kept: ReturnType<typeof journal>,
  body: (run: Run) => Promise<T>
): Promise<T> {
  const run = await Run.begin(id, kept as unknown as Journal, 600)

  return await run.within(() =>
    trail.follow({ hops: [], id }, async () => await body(Run.current()!))
  )
}

it('should give back what an earlier attempt was answered', async () => {
  const kept = journal()
  const make = mock.fn(async () => ({ n: 1 }))

  const first = await attempt('run1', kept, (run) =>
    run.step('call:a.b.c', [{ x: 1 }], make)
  )
  const second = await attempt('run1', kept, (run) =>
    run.step('call:a.b.c', [{ x: 1 }], make)
  )

  assert.deepStrictEqual(first, { n: 1 })
  assert.deepStrictEqual(second, { n: 1 })
  assert.equal(make.mock.callCount(), 1)
})

it('should make a step asked with other arguments', async () => {
  const kept = journal()
  const make = mock.fn(async () => 'made')

  await attempt('run2', kept, (run) => run.step('call:a.b.c', [{ x: 1 }], make))
  await attempt('run2', kept, (run) => run.step('call:a.b.c', [{ x: 2 }], make))

  assert.equal(make.mock.callCount(), 2)
})

it('should tell apart the same ask made twice', async () => {
  const kept = journal()
  let n = 0
  const make = async () => ++n

  const first = await attempt('run3', kept, async (run) => [
    await run.step('call:a.b.c', [], make),
    await run.step('call:a.b.c', [], make)
  ])

  const second = await attempt('run3', kept, async (run) => [
    await run.step('call:a.b.c', [], make),
    await run.step('call:a.b.c', [], make)
  ])

  assert.deepStrictEqual(first, [1, 2])
  assert.deepStrictEqual(second, [1, 2])
})

it('should give each branch its own answer whatever order they ask in', async () => {
  const kept = journal()
  const answer = async (x: number) => x * 10

  await attempt('run4', kept, async (run) => {
    await run.step('call:a.b.c', [1], () => answer(1))
    await run.step('call:a.b.c', [2], () => answer(2))
  })

  const replayed = await attempt('run4', kept, async (run) => [
    await run.step('call:a.b.c', [2], () => answer(-1)),
    await run.step('call:a.b.c', [1], () => answer(-1))
  ])

  assert.deepStrictEqual(replayed, [20, 10])
})

it('should give the operation what is kept rather than what it made', async () => {
  const kept = journal()

  // a copy of the run kept the step after this attempt recalled the run
  kept.record.mock.mockImplementation(async () => ({ value: 'first' }))

  const answer = await attempt('run5', kept, (run) =>
    run.step('call:a.b.c', [], async () => 'second')
  )

  assert.equal(answer, 'first')
})

it('should give back a value taken at once', async () => {
  const kept = journal()
  let now = 1000

  const first = await attempt('run6', kept, async (run) => run.value('now', () => now++))

  await (await Run.begin('run6', kept as unknown as Journal, 600)).settle()

  const second = await attempt('run6', kept, async (run) => run.value('now', () => now++))

  assert.equal(first, 1000)
  assert.equal(second, 1000)
})

it('should keep a value taken at once before the next step is made', async () => {
  const kept = journal()
  const order: string[] = []

  kept.record.mock.mockImplementation(async (_run: string, key: string, answer: Kept) => {
    order.push('kept')
    kept.records.set(key, answer)

    return answer
  })

  await attempt('run7', kept, async (run) => {
    run.value('random', () => 0.5)
    await run.step('call:a.b.c', [], async () => {
      order.push('made')
    })
  })

  assert.deepStrictEqual(order.slice(0, 2), ['kept', 'made'])
})

it('should not be the run of a call the run makes', async () => {
  const kept = journal()
  const run = await Run.begin('run8', kept as unknown as Journal, 600)

  const inner = await run.within(() =>
    trail.follow({ hops: [], id: 'derived' }, async () => Run.current())
  )

  assert.equal(inner, undefined)
})

it('should fix when the run is reaped at its first step', async () => {
  const kept = journal()
  const before = Date.now()

  await attempt('run9', kept, async (run) => {
    await run.step('call:a.b.c', [1], async () => 1)
    await run.step('call:a.b.c', [2], async () => 2)
  })

  const [first, second] = kept.record.mock.calls.map(
    (call) => call.arguments[3] as number
  )

  assert.equal(first, second)
  assert.ok(first >= before + 600_000)
})
