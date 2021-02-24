'use strict'

const yaml = require('js-yaml')
const fs = require('fs-extra')

const { console } = require('../../util/console')

async function manifest ({ name }) {
  if (await fs.pathExists(MANIFEST_FILE)) { throw new Error(`Manifest '${MANIFEST_FILE}' already exists`) }

  const manifest = { name }
  const content = yaml.dump(manifest, YAML_OPTIONS)

  // noinspection JSUnresolvedFunction
  await fs.writeFile(MANIFEST_FILE, content)
  console.info(`Manifest '${MANIFEST_FILE}' created`)
}

const MANIFEST_FILE = 'kookaburra.yaml'
const YAML_OPTIONS = { styles: { '!!null': 'canonical' } }

exports.manifest = manifest
