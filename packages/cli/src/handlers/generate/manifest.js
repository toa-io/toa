'use strict'

const yaml = require('js-yaml')
const fs = require('fs-extra')

const MANIFEST_FILE = 'kookaburra.yaml'
const YAML_OPTIONS = { styles: { '!!null': 'canonical' } }

async function manifest ({ name }) {
  const manifest = { name }
  const content = yaml.dump(manifest, YAML_OPTIONS)

  if (await fs.pathExists(MANIFEST_FILE)) { throw new Error(`Manifest ${MANIFEST_FILE} already exists`) }

  // noinspection JSUnresolvedFunction
  await fs.writeFile(MANIFEST_FILE, content)
  console.info(`${MANIFEST_FILE} created`)
}

exports.manifest = manifest
