'use strict'

const execa = require('execa')

const list = async (registry) => {
  const { stdout } = await execa('docker',
    ['images', '--filter', `reference=${registry}/*`, '--format', '{{.Repository}},{{.Tag}},{{.ID}}'])

  if (stdout.length === 0) return []

  const lines = stdout.split('\n')

  return lines.map((line) => {
    const [repository, tag, id] = line.split(',')

    return { repository, tag, id }
  })
}

const clear = async (registry) => {
  const images = await list(registry)

  for (const image of images) await execa('docker', ['rmi', image.id])
}

exports.list = list
exports.clear = clear
