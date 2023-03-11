'use strict'

const { deployment } = require('../')

it('should be', () => {
  expect(deployment).toBeDefined()
})

it('should throw if annotation is not defined', () => {
  const instances = []

  expect(() => deployment(instances, undefined)).toThrow('is required')
})
