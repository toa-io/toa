'use strict'

const { flip } = require('@toa.io/libraries/generic')

const components = jest.fn(async () => flip())
const mock = { components: { components } }

exports.mock = mock
