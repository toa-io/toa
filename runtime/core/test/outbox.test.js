'use strict'

const { Outbox } = require('../src/outbox')

let emission, storage, atom, outbox

const BATCH = 4

/** rows as the storage hands them back, ids ascending like the uuid v7 they are */
const page = (from, count) =>
  Array.from({ length: count }, (_, i) => ({
    id: String(from + i).padStart(4, '0'),
    event: { state: {} }
  }))

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()

  emission = { emit: jest.fn(async () => undefined), link: jest.fn() }

  storage = {
    link: jest.fn(),
    outbox: {
      pending: jest.fn(async () => []),
      settle: jest.fn(async () => undefined)
    }
  }

  atom = { slots: jest.fn(() => [0]), link: jest.fn() }
  outbox = new Outbox(emission, storage, atom, { interval: 1000, batch: BATCH })
})

afterEach(() => {
  jest.useRealTimers()
})

/** one cycle, and everything it awaited */
const cycle = async () => {
  jest.advanceTimersByTime(1000)

  for (let i = 0; i < 20; i++) await Promise.resolve()
}

it('should read nothing more when the first page is short', async () => {
  storage.outbox.pending.mockResolvedValueOnce(page(0, 3))

  await outbox.open()
  await cycle()

  expect(storage.outbox.pending).toHaveBeenCalledTimes(1)
  expect(emission.emit).toHaveBeenCalledTimes(3)
})

it('should keep reading while a page comes back full', async () => {
  storage.outbox.pending
    .mockResolvedValueOnce(page(0, BATCH))
    .mockResolvedValueOnce(page(BATCH, BATCH))
    .mockResolvedValueOnce(page(2 * BATCH, 5))

  await outbox.open()
  await cycle()

  expect(storage.outbox.pending).toHaveBeenCalledTimes(3)
  expect(emission.emit).toHaveBeenCalledTimes(2 * BATCH + 5)
})

it('should continue each page from the id the one before ended on', async () => {
  storage.outbox.pending
    .mockResolvedValueOnce(page(0, BATCH))
    .mockResolvedValueOnce(page(BATCH, 1))

  await outbox.open()
  await cycle()

  const [, second] = storage.outbox.pending.mock.calls

  expect(storage.outbox.pending.mock.calls[0][3]).toBeUndefined()
  expect(second[3]).toStrictEqual(String(BATCH - 1).padStart(4, '0'))
})

it('should mark what it published, once, after the last page', async () => {
  storage.outbox.pending
    .mockResolvedValueOnce(page(0, BATCH))
    .mockResolvedValueOnce(page(BATCH, 2))

  await outbox.open()
  await cycle()

  expect(storage.outbox.settle).toHaveBeenCalledTimes(1)
  expect(storage.outbox.settle.mock.calls[0][0]).toHaveLength(BATCH + 2)
})

it('should not publish a row it has published and not yet marked', async () => {
  storage.outbox.settle.mockRejectedValueOnce(new Error('mongo is out'))
  storage.outbox.pending
    .mockResolvedValueOnce(page(0, 2))
    .mockResolvedValueOnce(page(0, 2))

  await outbox.open()
  await cycle()
  await cycle()

  expect(emission.emit).toHaveBeenCalledTimes(2)
})

it('should read nothing while it owns no slots', async () => {
  atom.slots.mockReturnValue(null)

  await outbox.open()
  await cycle()

  expect(storage.outbox.pending).not.toHaveBeenCalled()
})
