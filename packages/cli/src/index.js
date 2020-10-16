const { program } = require('commander');

const pack = require('../package');
const action = require('./action');
const invoke = require('./commands/invoke');

program
    .name('koo')
    .version(pack.version, '-v, --version', 'output current version')
    .option('-d, --debug', 'output extra debugging');

program
    .command('invoke <component> <operation> [input] [query]')
    .description('invoke operation')
    .action(action(invoke));

program.parse(process.argv);
