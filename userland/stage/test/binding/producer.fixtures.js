'use strict'

const { generate } = require('randomstring')

const endpoints = [generate(), generate()]
const invoke = jest.fn(async () => generate())
const producer = /** @type {jest.MockedObject<toa.core.Component>} */ { invoke }

exports.endpoints = endpoints
exports.producer = producer
