'use strict'

const { lookup } = require('../src/lookup')

it('should resolve from node_modules', () => {
  expect(lookup('js-yaml')).toMatch(/node_modules\/js-yaml$/)
})

it('should resolve relatively', () => {
  expect(lookup('../src/lookup', __dirname)).toMatch(/runtime\/gears\/src$/)
})
