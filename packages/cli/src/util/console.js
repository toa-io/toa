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

    return target[key]
  }
})

exports.console = console
