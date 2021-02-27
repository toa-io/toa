'use strict'

const chalk = require('chalk')

let level = 'trace'

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

    if (key in LEVELS && LEVELS[key] < LEVELS[level]) {
      return () => {}
    }

    if (key === 'error') {
      return (...args) => global.console.error(chalk.red('error'), ...args)
    }

    if (key === 'info') {
      return (...args) => global.console.info(chalk.blue('info'), ...args)
    }

    if (key === 'warn') {
      return (...args) => global.console.warn(chalk.yellow('warn'), ...args)
    }

    if (key === 'debug') {
      return (...args) => global.console.debug(chalk.cyan('debug'), ...args)
    }

    return target[key]
  }
})

const LEVELS = ['trace', 'debug', 'info', 'warn', 'error'].reduce((acc, level, index) => {
  acc[level] = index

  return acc
}, {})

exports.console = console
