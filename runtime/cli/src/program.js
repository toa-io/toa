'use strict'

const yargs = require('yargs')

const { console } = require('@kookaburra/gears')
const { version } = require('../package.json')

// noinspection JSValidateTypes
const argv = yargs(process.argv.slice(2))
  .fail((message, err, yargs) => {
    if (err) message = err
    else yargs.showHelp()

    console.error(message)

    process.exit(err ? 1 : 0)
  })
  .option('log', {
    type: 'string',
    describe: 'Logging level',
    default: process.env.KOO_ENV === 'dev' ? 'info' : 'warn'
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

process.on('unhandledRejection', (e) => {
  console.error(e)
  process.exit(1)
})
