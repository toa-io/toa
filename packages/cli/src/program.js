'use strict'

const yargs = require('yargs/yargs')
const chalk = require('chalk')

const { version } = require('../package.json')

const argv = yargs(process.argv.slice(2))
  .fail((message, err, yargs) => {
    if (err) {
      if (argv.verbose) { console.error(err) }

      message = err.message
    } else yargs.showHelp()

    console.error(chalk.red('error'), message)
    process.exit(1)
  })
  .option('verbose', {
    type: 'boolean',
    default: false
  })
  .strictCommands()
  .commandDir('./commands')
  .demandCommand()
  .help()
  .version(version)
  .alias('h', 'help')
  .alias('v', 'version')
  .parse()
