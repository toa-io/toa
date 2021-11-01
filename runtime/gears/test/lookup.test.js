'use strict'

const { lookup } = require('../src/lookup')

it('should resolve from node_modules', () => {
  expect(lookup('js-yaml', __dirname)).toMatch(/node_modules\/js-yaml/)
})

it('should resolve well-known references', () => {
  expect(lookup('http', __dirname)).toMatch(/bindings\.http/)
})

it('should resolve relatively', () => {
  expect(lookup('../', __dirname)).toMatch(/runtime\/gears/)
})
