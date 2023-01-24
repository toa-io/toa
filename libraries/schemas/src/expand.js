'use strict'

const cos = require('@toa.io/libraries/cos')
const { is } = require('./validator')

/** @type {toa.schemas.expand} */
const expand = (object) => cos.expand(object, is)

exports.expand = expand
