'use strict'

// eslint-disable-next-line no-throw-literal
module.exports = jest.fn(async () => { throw { code: 1, message: 'oops' } })
