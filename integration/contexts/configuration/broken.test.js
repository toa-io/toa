'use strict'

const { join } = require('node:path')
const boot = require('@toa.io/boot')

it('should fail if component does not exist or defines schema', async () => {
  const source = join(__dirname, 'broken-0')
  await expect(boot.deployment(source)).rejects.toThrow(/Configuration Schema/)
})

it('should fail if object doesn\'t match schema', async () => {
  const source = join(__dirname, 'broken-1')
  await expect(boot.deployment(source)).rejects.toThrow(/foo must be number/)
})
