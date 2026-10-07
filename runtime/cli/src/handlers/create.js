import { createRequire } from 'node:module'
import { cp, readdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/**
 * Writes the application `@toa.io/userland` carries as a template into the working directory.
 *
 * @param {{ name: string }} argv
 */
export async function create(argv) {
  const name = String(argv.name)
  const target = process.cwd()

  // refused before anything is written: half an application is worse than none
  if (!NAME.test(name)) throw new Error(`'${name}' is not a name an application can have`)

  const present = (await readdir(target)).filter((entry) => !IGNORED.includes(entry))

  if (present.length > 0)
    throw new Error(`The directory is not empty: it holds ${present.slice(0, 3).join(', ')}`)

  const manifest = locate()
  const userland = require(manifest)
  const source = join(dirname(manifest), 'template')

  const values = {
    name,
    version: userland.version,
    agent: userland.dependencies['@toa.io/agent']
  }

  await cp(source, target, { recursive: true })

  // npm leaves a `.gitignore` out of a package, so the template carries it under another name
  await rename(join(target, '_gitignore'), join(target, '.gitignore'))

  for (const entry of await readdir(target, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || entry.parentPath.startsWith(join(target, '.git'))) continue

    const path = join(entry.parentPath, entry.name)
    const contents = await readFile(path, 'utf8')
    const written = contents.replace(VALUE, (match, key) => values[key] ?? match)

    if (written !== contents) await writeFile(path, written, 'utf8')
  }

  console.log(NEXT)
}

const require = createRequire(import.meta.url)

/** The template is the development kit's, which the CLI does not bring with it. */
function locate() {
  try {
    return require.resolve('@toa.io/userland/package.json')
  } catch {
    throw new Error(
      '`toa create` needs @toa.io/userland beside the CLI: ' +
        'npx -p @toa.io/cli -p @toa.io/userland toa create <name>'
    )
  }
}

/** What a Context may be called, as its schema has it. */
const NAME = /^([a-zA-Z]+([_a-zA-Z0-9]*[a-zA-Z0-9]+)?)(-([a-zA-Z]+([_a-zA-Z0-9]*[a-zA-Z0-9]+)?))*$/

/** A repository cloned before its first commit is an empty directory. */
const IGNORED = ['.git']

/** `{{name}}`: a value the template leaves to whoever creates the application. */
const VALUE = /\{\{(\w+)}}/g

const NEXT = `Created. Next:

  npm install       # the packages, and what the declarations require beyond them
  npm run dock      # the broker, the database and Redis, in Docker
  npm run env       # types, .env and .map.json
  npm run features  # the scenarios
  npm start         # the application, on http://localhost:8000
`
