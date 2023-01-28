'use strict'

const { generate } = require('randomstring')

const expand = /** @type {jest.MockedFn<toa.schemas.expand>} */
  jest.fn(() => generate())

const is = /** @type {toa.schemas.valid} */ generate()

const concise = { expand }
const validator = { is }

exports.mock = { concise, validator }
