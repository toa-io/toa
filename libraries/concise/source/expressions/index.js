'use strict'

const { regular } = require('./regular')
const { map } = require('./map')
const { reference } = require('./reference')
const { formats } = require('./formats')
const { string } = require('./string')
const { range } = require('./range')
const { undef } = require('./undefined')

module.exports = [regular, map, reference, string, formats, range, undef]
