'use strict'

const { console } = require('openspan')

const enabled = process.env.TOA_BOOT_TRACE === '1'

/**
 * Creates a span if boot tracing is enabled (TOA_BOOT_TRACE=1), otherwise just runs the task
 *
 * @param {string | object} options
 * @param {() => Promise<any>} task
 * @returns {Promise<any>}
 */
const span = async (options, task) => enabled ? console.span(options, task) : task()

exports.span = span
