'use strict'

const { merge } = require('./merge')

/** @type {toa.generic.Patch} */
const patch = (target, source) => merge(target, source, OPTIONS)

const OPTIONS = { override: true }

exports.patch = patch
