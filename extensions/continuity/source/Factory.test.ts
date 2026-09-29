import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Connector, Context, Locator } from '@toa.io/core'
import type { Component } from '@toa.io/core'
import { Factory } from './Factory.ts'
import type { extensions } from '@toa.io/core/types'

const locator = new Locator('flow', 'continued')

/** the journal, answering an empty run and keeping whatever it is given */
const journal = {
  invoke: mock.fn(async (endpoint: string, request: any) =>
    endpoint === 'recall' ? [] : request.input.answer
  ),
  connect: mock.fn(async () => undefined),
  link: mock.fn()
}

const host = { remote: mock.fn(async () => journal) } as unknown as extensions.Host

let factory: Factory
let component: Component
let invoke: ReturnType<typeof mock.fn>

beforeEach(() => {
  journal.invoke.mock.resetCalls()

  factory = new Factory(host)
  invoke = mock.fn(async () => ({ output: 'done' }))

  component = Object.assign(new Connector(), { locator, invoke }) as unknown as Component

  factory.aspect(locator, { run: 600 })
  factory.component(component)
})

it('should refuse a call that waits for a continued operation', async () => {
  const reply = await component.invoke('run', { id: 'a1', input: null })

  assert.equal(reply.exception.code, 202)
  assert.equal(invoke.mock.callCount(), 0)
})

it('should refuse a task that carries no identity', async () => {
  const reply = await component.invoke('run', { task: true, input: null })

  assert.equal(reply.exception.code, 202)
  assert.equal(invoke.mock.callCount(), 0)
})

it('should run a task', async () => {
  const reply = await component.invoke('run', { id: 'a1', task: true, input: null })

  assert.deepStrictEqual(reply, { output: 'done' })
  assert.equal(journal.invoke.mock.calls[0].arguments[0], 'recall')
})

it('should run an event a receiver handed on', async () => {
  const reply = await component.invoke('run', {
    id: 'a1',
    input: null,
    trail: ['continued.source.create', '~continued.source.created']
  })

  assert.deepStrictEqual(reply, { output: 'done' })
})

it('should leave an operation it does not continue alone', async () => {
  const reply = await component.invoke('other', { input: null })

  assert.deepStrictEqual(reply, { output: 'done' })
  assert.equal(journal.invoke.mock.callCount(), 0)
})

it('should answer an exception where the run cannot be recalled', async () => {
  journal.invoke.mock.mockImplementationOnce(async () => {
    throw new Error('no journal')
  })

  const reply = await component.invoke('run', { id: 'a1', task: true, input: null })

  assert.equal(reply.exception.code, 0)
  assert.equal(invoke.mock.callCount(), 0)
})

it('should leave the context of a component that declares nothing alone', () => {
  const local = { locator: new Locator('other', 'continued'), link: mock.fn() }
  const context = new Context(
    local as unknown as Component,
    async () => undefined as any,
    []
  )
  const call = context.call

  factory.context(context)

  assert.equal(context.call, call)
})

it('should pass through what is asked outside a run', async () => {
  const local = { locator, link: mock.fn(), invoke: mock.fn(async () => 'applied') }
  const logs = Object.assign(new Connector(), { name: 'logs', invoke: mock.fn() })
  const stash = Object.assign(new Connector(), {
    name: 'stash',
    invoke: mock.fn(async () => 'stashed')
  })
  const context = new Context(
    local as unknown as Component,
    async () => undefined as any,
    [logs, stash] as unknown as extensions.Aspect[]
  )

  factory.context(context)

  assert.equal(await context.apply('run', {}), 'applied')
  assert.equal(await context.aspects[1].invoke('get', 'key'), 'stashed')
  assert.equal(context.aspects[0], logs, 'a log is no step, and is not wrapped')
  assert.equal(typeof context.now(), 'number')
  assert.equal(journal.invoke.mock.callCount(), 0)
})
