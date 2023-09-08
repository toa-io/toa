import { generate } from 'randomstring'
import { Locator } from '@toa.io/core'
import { Tenant } from './Tenant'
import { broadcast } from './Factory.fixtures'
import { type Branch } from './Branch'
import type * as RTD from './RTD/syntax'

const component = generate()
const namespace = generate()
const locator = new Locator(component, namespace)
const node = { [generate()]: generate() } as unknown as RTD.Node
const branch: Branch = { namespace, component, node, isolated: false }

let tenant: Tenant

beforeEach(async () => {
  jest.clearAllMocks()

  tenant = new Tenant(broadcast, locator, node)

  await tenant.open()
})

it('should depend on broadcast', async () => {
  expect(broadcast.link).toHaveBeenCalledWith(tenant)
})

it('should expose on startup', async () => {
  expect(broadcast.transmit).toHaveBeenCalledWith('expose', branch)
})

it('should expose on ping', async () => {
  expect(broadcast.transmit).toHaveBeenCalledTimes(1)
  expect(broadcast.receive).toHaveBeenCalledWith('ping', expect.any(Function))

  const expose = broadcast.receive.mock.calls[0][1]

  await expose(undefined)

  expect(broadcast.transmit).toHaveBeenCalledTimes(2)
})
