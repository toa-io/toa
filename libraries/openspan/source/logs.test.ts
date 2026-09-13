import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Console, consoleLogs, logging, logs, OtlpLogs, sinks } from './index.ts'
import type { Entry } from './Console.ts'

afterEach(() => {
  logging(null)
})

beforeEach(() => {
  streams.stdout.write.mock.resetCalls()
  streams.stderr.write.mock.resetCalls()
})

const streams: any = {
  stdout: { write: mock.fn() },
  stderr: { write: mock.fn() }
}

it('should write to the console by default', () => {
  assert.deepStrictEqual(sinks(), [consoleLogs])
})

it('should keep the console when nothing is configured', () => {
  logs()

  assert.deepStrictEqual(sinks(), [consoleLogs])
})

it('should keep the console beside the otlp exporter', () => {
  logs({ exporters: { otlp: { endpoint: 'http://localhost:1' } } })

  const [first, second] = sinks()

  assert.strictEqual(sinks().length, 2)
  assert.strictEqual(first, consoleLogs)
  assert.ok(second instanceof OtlpLogs)
})

it('should drop the console when it is turned off', () => {
  logs({ exporters: { console: false, otlp: { endpoint: 'http://localhost:1' } } })

  const [only] = sinks()

  assert.strictEqual(sinks().length, 1)
  assert.ok(only instanceof OtlpLogs)
})

it('should export nowhere when the console is turned off alone', () => {
  logs({ exporters: { console: false } })

  assert.deepStrictEqual(sinks(), [])
})

it('should restore the default', () => {
  logs({ exporters: { console: false } })
  logging(null)

  assert.deepStrictEqual(sinks(), [consoleLogs])
})

it('should write nothing to the streams when the console is turned off', () => {
  const entries: Entry[] = []

  logging([{ export: (entry) => entries.push(entry) }])

  const console = new Console({ streams })

  console.info('Hello, world!')

  assert.strictEqual(streams.stdout.write.mock.callCount(), 0)
  assert.strictEqual(entries.length, 1)
  assert.partialDeepStrictEqual(entries[0], {
    severity: 'INFO',
    message: 'Hello, world!'
  })
})

it('should hand the entry to every exporter, with the console that wrote it', () => {
  const seen: Array<[Entry, Console]> = []

  logging([consoleLogs, { export: (entry, output) => seen.push([entry, output]) }])

  const console = new Console({ streams, context: { component: 'pots' } })

  console.warn('Pot boiled over', { at: 100 })

  assert.strictEqual(seen.length, 1)
  assert.strictEqual(seen[0][1], console)
  assert.partialDeepStrictEqual(seen[0][0], {
    severity: 'WARN',
    message: 'Pot boiled over',
    attributes: { at: 100 },
    context: { component: 'pots' }
  })

  assert.strictEqual(streams.stdout.write.mock.callCount(), 1)
})

it('should not reach an exporter below the level', () => {
  const entries: Entry[] = []

  logging([{ export: (entry) => entries.push(entry) }])

  const console = new Console({ streams, level: 'warn' })

  console.info('quiet')
  console.warn('loud')

  assert.deepStrictEqual(
    entries.map((entry) => entry.message),
    ['loud']
  )
})
