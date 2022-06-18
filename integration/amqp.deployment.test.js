'use strict'

const { join } = require('node:path')

const boot = require('@toa.io/boot')
const { yaml, directory: { remove } } = require('@toa.io/gears')

const source = join(__dirname, './context')

/** @type {toa.operations.deployment.Operator} */
let operator
/** @type {string} */
let target
/** @type {toa.operations.deployment.Contents} */
let values

beforeAll(async () => {
  operator = await boot.deployment(source, 'dev')
  target = await operator.export()
})

beforeAll(async () => {
  const results = await Promise.all([yaml(join(target, 'Chart.yaml')), yaml(join(target, 'values.yaml'))])

  values = results[1]
})

afterAll(async () => {
  await remove(target)
})

it('should export proxies', () => {
  expect(values.proxies).toBeDefined()

  const proxy = values.proxies.find((proxy) => proxy.name === 'rabbitmq')

  expect(proxy).toBeDefined()
  expect(proxy.target).toStrictEqual('host.docker.internal')
})
