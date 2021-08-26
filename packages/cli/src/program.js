// noinspection JSUnresolvedVariable

'use strict'

const yargs = require('yargs')

const { console } = require('@kookaburra/gears')
const { version } = require('../package.json')

// noinspection JSValidateTypes
const argv = yargs(process.argv.slice(2))
  .fail((message, err, yargs) => {
    if (err) {
      if (argv.stacktrace) { console.dir(err) }

      message = err.message
    } else {
      yargs.showHelp()
    }

    console.error(message)

    process.exit(1)
  })
  .option('log', {
    type: 'string',
    describe: 'Logging level',
    default: process.env.NODE_ENV === 'local' ? 'info' : 'error'
  })
  .option('stacktrace', {
    type: 'boolean',
    describe: 'Print stack trace on errors',
    default: false
  })
  .option('ugly', {
    type: 'boolean',
    describe: 'Ugly output',
    default: false
  })
  .option('path', {
    type: 'string',
    desc: 'Working directory',
    default: '.'
  })
  .commandDir('./commands')
  .demandCommand()
  .strict()
  .help()
  .version(version)
  .alias('h', 'help')
  .alias('v', 'version')
  .parse()

console.level(argv.log)
