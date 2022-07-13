'use strict'

/** @type {toa.generic.Random} */
const random = (max = 100) => Math.round(Math.random() * max)

exports.random = random
