'use strict'

const { spawn } = require('node:child_process')
const { newid } = require('@toa.io/generic')

const shell = async (argv) => {
  const rnd = newid().substring(0, 6)

  const args = [
    'run',
    'shell-' + rnd,
    '--rm',
    '-i',
    '--tty',
    '--image',
    argv.image,
    '--restart=Never',
    '--'
  ]

  const extra = argv._.splice(1)

  if (extra.length > 0) args.push(...extra)
  else args.push('sh')

  await spawn('kubectl', args, { stdio: 'inherit' })
}

exports.shell = shell
