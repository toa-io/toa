import { mkdtemp, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { execa } from 'execa'

import { Service } from './service.js'

/**
 * Builds and pushes the image an extension ships for its service, so that an application
 * with `registry.services: published` takes it instead of building one.
 *
 * The image is built from the package as npm publishes it, not from the workspace: what
 * `.npmignore` leaves out is not in the tarball, and an application builds from the tarball.
 *
 * @param {string} workspace path to the extension's directory in this repository
 * @param {string} runtime the runtime version, which is the tag and the base image
 * @param {string[]} platforms
 * @returns {Promise<string>} the reference pushed
 */
export async function publish(workspace, runtime, platforms) {
  const directory = resolve(workspace)
  const manifest = read(join(directory, 'package.json'))

  // read from the workspace, where the extension's own dependencies resolve; what is
  // installed below carries the same constant but not everything it takes to load it
  const { image } = await import(pathToFileURL(join(directory, manifest.main)).href)

  if (image === undefined)
    throw new Error(`'${manifest.name}' publishes no service image: it exports no 'image'`)

  const root = await mkdtemp(join(tmpdir(), 'toa-publish'))

  await writeFile(join(root, 'package.json'), '{"private":true}')
  await run('npm', [
    'i',
    '--prefix',
    root,
    '--omit=dev',
    `${manifest.name}@${manifest.version}`
  ])

  const path = join(root, 'node_modules', manifest.name)

  const service = new Service(SCOPE, { version: runtime }, {}, path, {
    ...name(image),
    version: manifest.version
  })

  service.reference = `${image}:${runtime}`

  await service.prepare(await mkdtemp(join(tmpdir(), 'toa-images')))

  await run('docker', [
    'buildx',
    'build',
    '--platform',
    platforms.join(','),
    '--tag',
    service.reference,
    '--provenance=false',
    '--push',
    service.context
  ])

  return service.reference
}

/** The repository's last segment is what `Service` names an image, so it reads back. */
function name(image) {
  const match = /\/extension-([^-/]+)-([^/]+)$/.exec(image)

  if (match === null)
    throw new Error(`'${image}' is not named 'extension-<group>-<name>'`)

  return { group: match[1], name: match[2] }
}

const read = (path) => JSON.parse(readFileSync(path, 'utf8'))

const run = async (cmd, args) => {
  console.log('toa>', cmd, args.join(' '))

  await execa(cmd, args, { stdio: 'inherit' })
}

// the reference is assigned rather than derived from a scope
const SCOPE = ''

const PLATFORMS = 'linux/amd64,linux/arm64'

if (import.meta.main) {
  const [workspace, runtime, platforms = PLATFORMS] = process.argv.slice(2)

  console.log(await publish(workspace, runtime, platforms.split(',')))
}
