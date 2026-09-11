import { execFileSync, spawn } from 'node:child_process'
import { closeSync, existsSync, openSync, readdirSync, statSync } from 'node:fs'
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** A revision, and the installed tree it runs from. */
export interface Tree {
  ref: string
  sha: string
  root: string
  /** the checkout itself, as it stands */
  working: boolean
}

export function git(repository: string, ...args: string[]): string {
  return execFileSync('git', ['-C', repository, ...args], { encoding: 'utf8' }).trim()
}

export function base(repository: string): string {
  return git(repository, 'merge-base', 'HEAD', 'origin/dev')
}

/**
 * The working tree where no ref is given; otherwise the revision unpacked and installed in the
 * cache, once per commit.
 */
export async function resolve(repository: string, ref: string | undefined, cache: string): Promise<Tree> {
  if (ref === undefined)
    return { ref: 'working tree', sha: git(repository, 'rev-parse', 'HEAD'), root: repository, working: true }

  const sha = git(repository, 'rev-parse', '--verify', `${ref}^{commit}`)
  const trees = join(cache, 'trees')
  const root = join(trees, sha)
  const ready = join(root, '.ready')

  if (!existsSync(ready)) {
    await rm(root, { recursive: true, force: true })
    await mkdir(root, { recursive: true })

    const log = join(cache, 'logs', `tree-${sha}.log`)

    await mkdir(join(cache, 'logs'), { recursive: true })
    console.log(`Installing ${ref} (${sha.slice(0, 7)}) into ${root}; log: ${log}`)

    await run(['sh', '-c', `git -C "${repository}" archive ${sha} | tar -x -C "${root}"`], { cwd: root, log })

    // `.gitattributes` keeps the lockfile out of an archive, and `npm ci` installs from nothing else
    await run(['sh', '-c', `git -C "${repository}" show ${sha}:package-lock.json > package-lock.json`], { cwd: root, log })
    await run(['npm', 'ci'], { cwd: root, log })
    await writeFile(ready, new Date().toISOString())
  }

  await prune(trees, KEEP)

  return { ref, sha, root, working: false }
}

/** Workspaces whose sources are newer than their build, which a run would silently ignore. */
export function stale(root: string): string[] {
  const found: string[] = []

  for (const group of ['runtime', 'connectors', 'extensions', 'libraries']) {
    const directory = join(root, group)

    if (!existsSync(directory)) continue

    for (const name of readdirSync(directory)) {
      const source = join(directory, name, 'source')
      const transpiled = join(directory, name, 'transpiled')

      if (!existsSync(source) || !existsSync(transpiled)) continue

      if (newest(source) > newest(transpiled)) found.push(`${group}/${name}`)
    }
  }

  return found
}

async function prune(trees: string, keep: number): Promise<void> {
  const entries = await readdir(trees).catch(() => [] as string[])
  const ready = await Promise.all(
    entries.map(async (name) => ({
      name,
      time: (await stat(join(trees, name, '.ready')).catch(() => null))?.mtimeMs ?? 0
    }))
  )

  for (const { name } of ready.sort((a, b) => b.time - a.time).slice(keep))
    await rm(join(trees, name), { recursive: true, force: true })
}

function newest(directory: string): number {
  let time = 0

  for (const entry of readdirSync(directory, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue

    time = Math.max(time, statSync(join(entry.parentPath, entry.name)).mtimeMs)
  }

  return time
}

async function run(argv: string[], where: { cwd: string; log: string }): Promise<void> {
  const [command, ...args] = argv
  const output = openSync(where.log, 'a')

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, { cwd: where.cwd, stdio: ['ignore', output, output] })

      child.on('error', reject)
      child.on('exit', (code) =>
        code === 0 ? resolve() : reject(new Error(`${argv.join(' ')} exited with ${code}; see ${where.log}`))
      )
    })
  } finally {
    closeSync(output)
  }
}

const KEEP = 3
