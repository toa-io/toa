'use strict'

/** @type {toa.generic.Sample} */
const sample = (array) => array[Math.floor(Math.random() * array.length)]

exports.sample = sample
