'use strict'

const chalk = require('chalk')

const _error = console.error
const _info = console.info

console.error = (...args) => {
  _error.call(console, chalk.red('error'), ...args)
}

console.info = (...args) => {
  _info.call(console, chalk.blue('info'), ...args)
}
