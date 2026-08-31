'use strict'

const { console, traces } = require('openspan')

const enabled = process.env.TOA_BOOT_TRACE === '1'

// Tracing is off until an exporter is configured, and the CLI opens its own span before
// any extension gets to configure one — so asking for a boot trace turns the console
// exporter on here. Extensions keep it: see `development()` in the telemetry factory.
if (enabled) traces({ exporters: { console: {} } })

/**
 * Creates a span if boot tracing is enabled (TOA_BOOT_TRACE=1), otherwise just runs the task
 *
 * @param {string | object} options
 * @param {() => Promise<any>} task
 * @returns {Promise<any>}
 */
const span = async (options, task) => enabled ? console.span(options, task) : task()

exports.span = span
