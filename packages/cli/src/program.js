'use strict'

const yargs = require('yargs')

const { console } = require('@kookaburra/gears')
const { version } = require('../package.json')

const argv = yargs(process.argv.slice(2))
  .fail((message, err, yargs) => {
    if (err) {
      if (argv.debug) { console.dir(err) }

      message = err.message
    } else {
      yargs.showHelp()
    }

    console.error(message)
    process.exit(1)
  })
  .option('verbose', {
    type: 'boolean',
    default: false
  })
  .option('debug', {
    type: 'boolean',
    default: false,
    hidden: true
  })
  .commandDir('./commands')
  .demandCommand()
  .strict()
  .help()
  .version(version)
  .alias('h', 'help')
  .alias('v', 'version')
  .parse()

console.level(argv.verbose ? 'debug' : 'info')
