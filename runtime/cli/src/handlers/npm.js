import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { context as load } from '@toa.io/norm'
import { environment as variables, findUp } from '@toa.io/generic'

import { context as find } from '../util/find.js'

/**
 * Installs what this Context's components declare and Toa's packages do not carry: a storage
 * provider's SDK, what a component an extension ships imports. A deploy installs the same set
 * into the image it builds; a workspace has no image, so it is installed here.
 */
export async function npm(argv) {
  const path = find(argv.path)
  const environment = argv.environment ?? variables.get('TOA_ENV') ?? 'local'
  const context = await load(path, environment)
  const workspace = findUpwards(path)
  const root = dirname(workspace)

  const manifest = JSON.parse(readFileSync(workspace, 'utf8'))
  const required = declared(context)
  const missing = Object.entries(required)
    .filter(([name, version]) => !declares(manifest, name, version))
    .sort(([a], [b]) => a.localeCompare(b))

  if (missing.length === 0) {
    if (argv.quiet !== true) console.log('Nothing to install')

    return
  }

  const specifiers = missing.map(([name, version]) => `${name}@${version}`)

  if (argv.dryRun === true) {
    for (const specifier of specifiers) console.log(specifier)

    return
  }

  await run(root, specifiers)
}

/**
 * What the packages that read this Context's declarations need, by package name: what each
 * component declares, and what the services bring with them.
 *
 * @param {toa.norm.Context} context
 * @returns {Record<string, string>}
 */
function declared(context) {
  const required = { ...context.packages }

  for (const component of context.components ?? [])
    Object.assign(required, component.packages)

  return required
}

/**
 * Whether the workspace declares it, at the version wanted. What it merely has installed does
 * not count: a package that reaches it through a dependency of Toa's is one Toa is about to
 * stop carrying, and the workspace is what has to say it needs it.
 */
function declares(manifest, name, version) {
  return (
    manifest.dependencies?.[name] === version ||
    manifest.devDependencies?.[name] === version
  )
}

/** Where the workspace's `devDependencies` are: the nearest manifest above the Context. */
function findUpwards(path) {
  const found = findUp('package.json', { cwd: path })

  if (found === undefined)
    throw new Error(`No package.json above '${path}' to install into`)

  return found
}

async function run(root, specifiers) {
  console.log(`Installing ${specifiers.join(' ')} into ${root}`)

  const code = await new Promise((resolve, reject) => {
    const child = spawn('npm', ['i', '--save-dev', ...specifiers], {
      cwd: root,
      stdio: 'inherit'
    })

    child.on('error', reject)
    child.on('close', resolve)
  })

  if (code !== 0) throw new Error(`npm exited with ${code}`)
}
