import { parseArgs } from 'node:util'
import { Comparison } from './comparison.ts'
import { available } from './oha.ts'
import { profile } from './profiling.ts'
import { CACHE, open, REPOSITORY, SIDES } from './run.ts'
import { select } from './scenarios.ts'
import { Stack } from './stack.ts'
import { base, resolve, stale } from './trees.ts'
import type { Tree } from './trees.ts'

const { values } = parseArgs({
  options: {
    base: { type: 'string' },
    head: { type: 'string' },
    ref: { type: 'string' },
    scenarios: { type: 'string' },
    blocks: { type: 'string' },
    window: { type: 'string' },
    threshold: { type: 'string' },
    quick: { type: 'boolean', default: false },
    profile: { type: 'boolean', default: false },
    clean: { type: 'boolean', default: false }
  }
})

const timing = {
  blocks: Number(values.blocks ?? (values.quick ? 3 : 4)),
  window: Number(values.window ?? (values.quick ? 5 : 10)),
  warmup: values.quick ? 2 : 3
}

try {
  if (values.clean) await clean()
  else if (values.profile) await profiling()
  else await comparison()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}

async function comparison(): Promise<void> {
  if (timing.blocks < 2) throw new Error('A comparison needs at least two blocks')

  const scenarios = select(values.scenarios?.split(','))

  await available()

  const trees = {
    base: await resolve(REPOSITORY, values.base ?? base(REPOSITORY), CACHE),
    head: await resolve(REPOSITORY, values.head, CACHE)
  }

  if (values.base === undefined) trees.base.ref = 'merge base with origin/dev'

  warn(trees.head)

  const run = await open(timing)

  try {
    const comparison = new Comparison(run, trees, { scenarios, threshold: Number(values.threshold ?? 0.05) })

    console.log('\n' + (await comparison.execute()))
  } finally {
    await run.stack.close()
  }
}

async function profiling(): Promise<void> {
  const scenarios = select(values.scenarios?.split(','))

  await available()

  const tree = await resolve(REPOSITORY, values.ref, CACHE)

  warn(tree)

  const run = await open(timing)

  try {
    console.log('\n' + (await profile(run, tree, scenarios)))
  } finally {
    await run.stack.close()
  }
}

async function clean(): Promise<void> {
  const stack = new Stack()

  await stack.connect()

  try {
    for (const side of Object.values(SIDES)) await stack.remove(side.context)
  } finally {
    await stack.close()
  }

  console.log('Removed the vhosts and databases of both sides')
}

function warn(tree: Tree): void {
  if (!tree.working) return

  const found = stale(tree.root)

  if (found.length > 0)
    console.warn(`Sources are newer than their build in ${found.join(', ')}; the run uses the build (npm run transpile)`)
}
