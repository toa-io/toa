'use strict'

const chalk = require('chalk')

const console = new Proxy(global.console, {
  get: (target, key) => {
    if (key === 'error') {
      return (...args) => global.console.error(chalk.red('error'), ...args)
    }

    if (key === 'info') {
      return (...args) => global.console.info(chalk.blue('info'), ...args)
    }

    if (key === 'dir') {
      return (obj) => {
        for (const prop in obj) if (obj[prop] === undefined) delete obj[prop]
        global.console.dir(obj, { depth: null })
      }
    }

    return target[key]
  }
})

exports.console = console
