'use strict'

const execa = require('execa')

/**
 * @param source {string}
 * @param target {string}
 * @returns {Promise<void>}
 */
const copy = (source, target) => execa('cp', ['-r', source, target])

exports.copy = copy
