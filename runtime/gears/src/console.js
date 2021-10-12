'use strict'

const chalk = require('chalk')

const console = new Proxy(global.console, {
  get: (target, key) => {
    if (key === 'level') {
      return (value) => (level = value)
    }

    if (key === 'dir') {
      return (obj) => {
        for (const prop in obj) if (obj[prop] === undefined) delete obj[prop]

        global.console.dir(obj, { depth: null })
      }
    }

    if (key in levels) {
      if (levels[key] < levels[level]) { return noop }

      return wrapped[key]
    }

    return target[key]
  }
})

let level = process.env.KOO_LOG_LEVEL || 'trace'

const colors = {
  info: 'blue',
  error: 'red',
  warn: 'yellow',
  debug: 'cyan'
}

const keys = ['trace', 'debug', 'info', 'warn', 'error']
const levels = Object.fromEntries(keys.map((level, index) => [level, index]))
const wrap = (key) => (...args) => global.console[key](chalk[colors[key]](key), ...args)
const wrapped = Object.fromEntries(keys.map(key => [key, wrap(key)]))
const noop = () => {}

exports.console = console
