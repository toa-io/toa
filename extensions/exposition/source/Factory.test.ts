import { generate } from 'randomstring'
import { Locator } from '@toa.io/core'
import * as _boot from '@toa.io/boot'
import { Tenant } from './Tenant'
import { Gateway } from './Gateway'
import { Factory } from './Factory'
import type { Node } from './RTD/syntax'

jest.mock('@toa.io/boot')
jest.mock('./Tenant')
jest.mock('./Gateway')

const boot = _boot as jest.MockedObjectDeep<typeof _boot>

it('should be', async () => {
  expect(Factory).toBeInstanceOf(Function)
})

let factory: Factory

beforeEach(() => {
  jest.clearAllMocks()

  factory = new Factory(boot)
})

describe('Tenant', () => {
  const name = generate()
  const locator = new Locator(name)
  const branch: Node = {}

  it('should be', async () => {
    expect(factory.tenant).toBeInstanceOf(Function)
  })

  it('should create Tenant', async () => {
    const instance = factory.tenant(locator, branch)

    expect(instance).toBeInstanceOf(Tenant)

    const broadcast = boot.bindings.broadcast.mock.results[0].value

    expect(Tenant).toHaveBeenCalledWith(broadcast, locator, branch)
  })
})

describe('Service', () => {
  it('should be', async () => {
    expect(factory.service).toBeInstanceOf(Function)
  })

  it('should return null if service name is unknown', async () => {
    const service = factory.service(generate())

    expect(service).toStrictEqual(null)
  })

  it('should return instance of Gateway', async () => {
    const instance = factory.service('gateway')

    expect(instance).toBeInstanceOf(Gateway)
  })
})
