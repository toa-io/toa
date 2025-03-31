import { setTimeout } from 'node:timers/promises'
import { Quotas } from './Quotas'
import type { Configuration } from './Configuration'
import type { Input as Context, Output } from '../../../../io'

let quotas: Quotas
let configuration: Configuration
let context: Context
let output: Output

beforeEach(() => {
  output = { status: 200 }
})

describe('common', () => {
  beforeEach(() => {
    context = createContext()
    configuration = createConfiguration()
    quotas = Quotas.create(configuration)
  })

  it('should be ok', () => {
    quotas.ok(context)
    quotas.use(context, output)
  })

  it('should throttle', () => {
    expect(quotas.ok(context)).toBe(true)

    quotas.use(context, output)
    quotas.use(context, output)

    expect(quotas.ok(context)).toBe(false)
  })

  it('should unblock after cooldown', async () => {
    quotas.use(context, output)
    quotas.use(context, output)

    expect(quotas.ok(context)).toBe(false)

    await setTimeout(configuration.cooldown)

    expect(quotas.ok(context)).toBe(true)
  })

  it('should reset after interval', async () => {
    quotas.use(context, output)

    // pseudo-synchronous intervals start somewhere between 0 and interval
    await setTimeout(configuration.interval * 2)

    quotas.use(context, output)

    expect(quotas.ok(context)).toBe(true)
  })
})

describe('path', () => {
  beforeEach(() => {
    configuration = createConfiguration()
    quotas = Quotas.create(configuration)
  })

  it('should have separate quotas', () => {
    const one = createContext({ url: new URL('http://localhost/one/') })
    const two = createContext({ url: new URL('http://localhost/two/') })

    quotas.use(one, output)
    quotas.use(one, output)

    expect(quotas.ok(one)).toBe(false)
    expect(quotas.ok(two)).toBe(true)

    quotas.use(two, output)
    quotas.use(two, output)

    expect(quotas.ok(two)).toBe(false)
  })
})

describe('ip', () => {
  beforeEach(() => {
    configuration = createConfiguration({ key: [{ method: 'ip' }] })
    quotas = Quotas.create(configuration)
  })

  it('should have separate quotas', () => {
    const one = createContext({ request: { headers: { 'x-forwarded-for': '1.1.1.1' } } })
    const two = createContext({ request: { headers: { 'x-forwarded-for': '2.2.2.2' } } })

    quotas.use(one, output)
    quotas.use(one, output)

    expect(quotas.ok(one)).toBe(false)
    expect(quotas.ok(two)).toBe(true)

    quotas.use(two, output)
    quotas.use(two, output)

    expect(quotas.ok(two)).toBe(false)
  })
})

describe('status', () => {
  beforeEach(() => {
    context = createContext()
    configuration = createConfiguration({ condition: [{ method: 'status', options: 404 }] })
    quotas = Quotas.create(configuration)
  })

  it('should not throttle on 200', () => {
    quotas.use(context, output)

    expect(quotas.ok(context)).toBe(true)
  })

  it('should throttle on 404', () => {
    quotas.use(context, { status: 404 })
    quotas.use(context, { status: 404 })

    expect(quotas.ok(context)).toBe(false)
  })
})

function createConfiguration (properties?: Partial<Configuration>): Configuration {
  return Object.assign({ key: [{ method: 'path' }], requests: 2, interval: 10, cooldown: 10 }, properties)
}

function createContext (properties?: any): Context {
  return Object.assign({ url: new URL('http://localhost/') }, properties) as unknown as Context
}
