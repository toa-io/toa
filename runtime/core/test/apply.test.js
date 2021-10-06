'use strict'

jest.mock('../src/connector')

const { Connector } = require('../src/connector')

const { Apply } = require('../src/apply')
const fixtures = require('./apply.fixtures')

let apply

beforeEach(() => {
  apply = new Apply(fixtures.runtime, fixtures.endpoint, fixtures.contract)
})

it('should depend on runtime', () => {
  expect(apply).toBeInstanceOf(Connector)
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.runtime)
})

it('should invoke', () => {
  const request = { foo: 'bar' }
  apply.apply(request)

  expect(fixtures.runtime.invoke).toHaveBeenCalledWith(fixtures.endpoint, request)
})

it('should fit contract', () => {
  const request = { foo: 'bar' }
  apply.apply(request)

  expect(fixtures.contract.fit).toHaveBeenCalledWith(request)
})
