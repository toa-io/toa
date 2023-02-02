'use strict'

/** @type {toa.generic.Random} */
const random = (max = 100) => Math.floor(Math.random() * max)

exports.random = random
