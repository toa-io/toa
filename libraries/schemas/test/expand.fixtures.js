'use strict'

const { generate } = require('randomstring')

const expand = /** @type {jest.MockedFn<toa.schemas.expand>} */
  jest.fn(() => generate())

const is = /** @type {toa.schemas.valid} */ generate()

const cos = { expand }
const validator = { is }

exports.mock = { cos, validator }
