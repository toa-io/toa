import { Ready } from './Ready'

let send: jest.Mock
let original: typeof process.send

beforeEach(() => {
  original = process.send
  send = jest.fn()
  process.send = send as unknown as typeof process.send
})

afterEach(() => {
  process.send = original
})

it('should signal readiness', async () => {
  const ready = Ready.create()!

  await ready.connect()
  await ready.complete()

  expect(send).toHaveBeenCalledWith('ready')

  await ready.disconnect()
})

// pm2 `wait_ready` blocks until `listen_timeout` when a process never signals,
// and processes sharing a host share the probe port
it('should signal readiness when the probe port is taken', async () => {
  const first = Ready.create()!
  const second = Ready.create()!

  await first.connect()
  await second.connect()

  await second.complete()

  expect(send).toHaveBeenCalledWith('ready')

  await first.disconnect()
  await second.disconnect()
})
