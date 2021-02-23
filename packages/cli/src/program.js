'use strict'

const yargs = require('yargs/yargs')
const chalk = require('chalk')

const { version } = require('../package.json')

yargs(process.argv.slice(2))
  .fail((message, err, yargs) => {
    if (err) {
      if (process.env.NODE_ENV === 'dev') { console.error(err) }

      message = err.message
    } else yargs.showHelp()

    console.error(chalk.red('error'), message)
    process.exit(1)
  })
  .strictCommands()
  .commandDir('./commands')
  .demandCommand()
  .help()
  .version(version)
  .parse()
