'use strict'

const { flip } = require('@toa.io/generic')

const components = jest.fn(async () => flip())
const mock = { components: { components } }

exports.mock = mock
