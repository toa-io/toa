import { resolve } from 'node:path'
import { type Readable } from 'node:stream'
import { generate } from 'randomstring'
import * as stage from '@toa.io/userland/stage'
import { type Component } from '@toa.io/core'
import { newid, timeout } from '@toa.io/generic'

let component: Component
let stream: Readable & { __id: string }
let events: Record<string, any[]> = {}

beforeEach(async () => {
  await run()
})

afterEach(async () => {
  stream?.destroy()
  await stop()
  events = {}
})

it('should route events', async () => {
  const event = generate()
  const data = generate()
  const key1 = newid()
  const key2 = newid()

  await create(key1)
  await create(key2)
  await push(key1, event, data)
  await push(key2, event, data)

  expect(events[key1]).toEqual([{ event, data }])
  expect(events[key1]).toEqual([{ event, data }])
})

it('should create fresh stream', async () => {
  const data = { foo: generate() }
  const key = newid()

  await create(key)
  await push(key, 'first', data)

  expect(events[key]).toEqual([{ event: 'first', data }])

  await create(key)
  await timeout(0)

  expect(events[key]).toEqual([])

  await push(key, 'second', data)

  expect(events[key]).toEqual([{ event: 'second', data }])
})

it('should ignore pushes to non-created streams', async () => {
  const data = { foo: generate() }
  const key = newid()

  await push(key, 'first', data)
  await create(key)

  expect(events[key]).toEqual([])

  await push(key, 'second', data)

  expect(events[key]).toEqual([{ event: 'second', data }])
})

it('should not destroy source stream if one of the forks is destroyed', async () => {
  const data = generate()
  const key = newid()

  await create(key)
  await push(key, 'first', data)

  const firstStream = stream
  const firstStreamEvents = events[key]

  await create(key)
  await push(key, 'second', data)

  expect(firstStreamEvents).toEqual([{ event: 'first', data }, { event: 'second', data }])
  expect(stream === firstStream).toBe(false)

  stream.destroy()

  await push(key, 'third', data)

  expect(firstStreamEvents).toEqual([
    { event: 'first', data },
    { event: 'second', data },
    { event: 'third', data }
  ])

  firstStream.destroy()
})

/// region component
async function run (name: string = 'streams'): Promise<void> {
  const path = resolve(__dirname, `../components/${name}`)

  component = await stage.component(path)
}

async function create (key: string): Promise<void> {
  const chunks: any[] = []

  events[key] = chunks

  stream = await component.invoke('create', { input: key })
  stream.__id = newid()
  stream.on('data', (chunk) => chunks.push(chunk))
}

async function stop (): Promise<void> {
  await component?.disconnect()
}

async function push (key: string, event: string, data: any): Promise<void> {
  await component.invoke('push', { input: { key, event, data } })
  await timeout(0) // wait for stream internals
}

/// endregion
