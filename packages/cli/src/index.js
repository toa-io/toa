const { program } = require('commander');

const pack = require('../package');
const action = require('./action');
const invoke = require('./commands/invoke');
const host = require('./commands/host');

program
    .name('koo')
    .version(pack.version, '-v, --version', 'output current version')
    .option('-d, --debug', 'output extra debugging');

program
    .command('invoke <component> <operation> [input] [query]')
    .description('invoke operation')
    .action(action(invoke));

program
    .command('host <component>')
    .description('host component')
    .action(action(host));

program.parse(process.argv);
