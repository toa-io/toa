import { generate } from 'randomstring'
import { immediate } from '@toa.io/generic'
import { Connector } from '@toa.io/core'
import { Gateway } from './Gateway'
import { broadcast, server, tree } from './Gateway.fixtures'
import { createIncomingMessage } from './HTTP/Server.fixtures'
import { MethodNotAllowed, NotFound, type Processing } from './HTTP'
import { type Node } from './RTD'

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

it('should add request handler', async () => {
  expect(server.attach).toHaveBeenCalledWith(expect.any(Function))
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
  const branch = { node: { '/foo': {} } }

  void merge(branch)

  expect(tree.merge).toHaveBeenCalledWith(branch.node, branch)
})

describe('request processing', () => {
  let process: Processing

  const method = generate()
  const reply = { output: generate() }
  const call = jest.fn(async () => reply)
  const message = createIncomingMessage(getPath(), method)

  beforeEach(async () => {
    await gateway.connect()
    await immediate()

    process = server.attach.mock.calls[0][0]
  })

  it('should find node', async () => {
    mockNode(method, call)

    await process(message)

    expect(tree.match).toHaveBeenCalledWith(message.path)
  })

  it('should throw if node is not found', async () => {
    const message = createIncomingMessage(getPath())

    tree.match.mockImplementationOnce(() => null)

    await expect(process(message)).rejects.toThrow(NotFound)
  })

  it('should throw if method is not found', async () => {
    const message = createIncomingMessage(getPath())
    const methods = new Map()
    const node = { methods } as unknown as Node

    tree.match.mockImplementationOnce(() => ({ node, parameters: [] }))

    await expect(process(message)).rejects.toThrow(MethodNotAllowed)
  })

  it('should call method', async () => {
    mockNode(method, call)

    await process(message)

    expect(call).toHaveBeenCalled()
  })

  it('should output reply', async () => {
    mockNode(method, call)

    const output = await process(message)

    expect(output).toMatchObject({ body: reply })
  })
})

function mockNode (verb: string, call: () => Promise<any>): jest.MockedObject<Node> {
  const method = { call }
  const methods = { [verb]: method }
  const node = { methods } as unknown as jest.MockedObject<Node>

  tree.match.mockImplementationOnce(() => ({ node, parameters: [] }))

  return node
}

function getPath (): string {
  return '/' + generate() + '/'
}
