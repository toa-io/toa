'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/libraries/generic')

const { ProcessorException } = require('../src/exceptions')
const { Conveyor } = require('../src')

it('should be', () => {
  expect(Conveyor).toBeDefined()
})

let processor

/** @type {toa.conveyor.Conveyor<number, string>} */
let conveyor

beforeEach(() => {
  processor = jest.fn(() => new Promise(() => {}))
  conveyor = new Conveyor(processor)
})

it('should return response', async () => {
  const unit = random()
  const result = generate()
  const complete = once()
  const promise = conveyor.process(unit)

  complete(result)

  await expect(promise).resolves.toStrictEqual(result)
})

it('should buffer units while processing', async () => {
  const amount = random(5) + 5
  const units = []
  const results = []
  const promises = []

  const first = once()
  const second = once()

  for (let i = 0; i < amount; i++) {
    const unit = random()
    const result = unit.toString()
    const promise = conveyor.process(unit)

    units.push(unit)
    promises.push(promise)
    results.push(result)
  }

  // first process
  const unit = units.shift()
  const result = results.shift()
  const promise = promises.shift()

  expect(processor).toHaveBeenCalledTimes(1)
  expect(processor).toHaveBeenNthCalledWith(1, [unit])

  first(result)

  await expect(promise).resolves.toStrictEqual(result)

  // second process
  expect(processor).toHaveBeenCalledTimes(2)
  expect(processor).toHaveBeenNthCalledWith(2, units)

  second(results)

  for (let i = 0; i < amount - 1; i++) {
    const promise = promises[i]
    const result = results[i]
    const value = await promise

    expect(value).toStrictEqual(result)
  }
})

it('should throw if amount of results doesn\'t match amount of units', async () => {
  const amount = random(5) + 5
  const promises = []

  const first = once()
  const second = once()

  for (let i = 0; i < amount; i++) {
    const promise = conveyor.process(random())

    promises.push(promise)
  }

  first([generate()])

  const promise = promises.shift()

  await promise

  second([generate()])

  await expect(Promise.all(promises)).rejects.toThrow(ProcessorException)
})

const once = () => {
  let complete

  processor.mockImplementationOnce(() => new Promise((resolve) => (complete = resolve)))

  return (result) => complete(result)
}
