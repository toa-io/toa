'use strict'

module.exports = jest.fn(async () => { throw new Error('oops') })
