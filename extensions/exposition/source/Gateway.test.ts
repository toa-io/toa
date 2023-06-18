import { Gateway } from './Gateway'
import { Connector } from '@toa.io/core'
import { broadcast, server, tree } from './Gateway.fixtures'
import { immediate } from '@toa.io/generic'

let gateway: Gateway

beforeEach(() => {
  jest.clearAllMocks()

  gateway = new Gateway(broadcast, server, tree)
})

it('should be instance of Connector', async () => {
  expect(gateway).toBeInstanceOf(Connector)
})

it('should depend on connectors', async () => {
  expect(broadcast.link).toHaveBeenCalledWith(gateway)
  expect(server.link).toHaveBeenCalledWith(gateway)
})

it('should ping on startup', async () => {
  await gateway.connect()
  await immediate()

  expect(broadcast.transmit).toHaveBeenCalledWith('ping', null)
})

it('should discover resources', async () => {
  await gateway.connect()
  await immediate()

  expect(broadcast.receive).toHaveBeenCalledWith('expose', expect.any(Function))
})

it('should merge branches', async () => {
  await gateway.connect()
  await immediate()

  const merge = broadcast.receive.mock.calls[0][1]
  const branch = { '/foo': {} }

  merge(branch)

  expect(tree.merge).toHaveBeenCalledWith(branch)
})
