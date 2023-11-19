'use strict'

const insertManyMock = jest.fn(() => ({ acknowledged: true }))
jest.mock('mongodb', () => ({
  __esModule: true,
  MongoClient: function () {
    this.connect = () => {},
    this.db = () => ({
      collection: () => ({
        insertMany: insertManyMock
      })
    })
    return this
  },
}))
jest.mock('@toa.io/pointer', () => ({
  __esModule: true,
  resolve: () => ['url'],
}))
const { generate } = require('randomstring')
const { Connection } = require('../src/connection')


let connection

beforeEach(async () => {
  jest.clearAllMocks()
  connection = new Connection({ id: 1 })
  await connection.open()
})

it('should be', () => {
  expect(Connection).toBeDefined()
})

it('should insert', async () => {
  const object = generate()

  await connection.add(object)

  expect(insertManyMock).toHaveBeenCalledWith([object])
})

it('should batch insert', async () => {
  const a = generate()
  const b = generate()
  const c = generate()

  await Promise.all([
    connection.add(a),
    connection.add(b),
    connection.add(c)
  ])

  expect(insertManyMock).toHaveBeenCalledTimes(2)
  expect(insertManyMock).toHaveBeenNthCalledWith(1, [a])
  expect(insertManyMock).toHaveBeenNthCalledWith(2, [b, c])
})
