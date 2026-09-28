import { parseArgs } from 'node:util'
import { Comparison } from './comparison.ts'
import { available } from './oha.ts'
import { profile } from './profiling.ts'
import { failure, post, pull } from './pull.ts'
import { CACHE, open, REPOSITORY } from './run.ts'
import { select } from './scenarios.ts'
import { SLOTS } from './slots.ts'
import { Stack } from './stack.ts'
import { base, resolve, stale } from './trees.ts'
import type { Pull } from './pull.ts'
import type { Scenario } from './scenarios.ts'
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
    pr: { type: 'string' },
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

  const pr = values.pr === undefined ? null : pull(REPOSITORY, values.pr)

  try {
    const report = await compare(scenarios, pr)

    console.log('\n' + report)

    if (pr !== null) post(REPOSITORY, pr, report)
  } catch (error) {
    if (pr !== null)
      post(
        REPOSITORY,
        pr,
        failure(pr, error instanceof Error ? error.message : String(error))
      )

    throw error
  }
}

async function compare(scenarios: Scenario[], pr: Pull | null): Promise<string> {
  const trees = {
    base: await resolve(REPOSITORY, values.base ?? pr?.base ?? base(REPOSITORY), CACHE),
    head: await resolve(REPOSITORY, values.head ?? pr?.head, CACHE)
  }

  if (values.base === undefined)
    trees.base.ref = `merge base with origin/${pr?.into ?? 'dev'}`
  if (values.head === undefined && pr !== null) trees.head.ref = `#${pr.number}`

  warn(trees.head)

  const run = await open(timing)

  try {
    const comparison = new Comparison(run, trees, {
      scenarios,
      threshold: Number(values.threshold ?? 0.05)
    })

    return await comparison.execute()
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
    for (const slot of Object.values(SLOTS)) await stack.remove(slot.context)
  } finally {
    await stack.close()
  }

  console.log('Removed the vhosts and databases of both sides')
}

function warn(tree: Tree): void {
  if (!tree.working) return

  const found = stale(tree.root)

  if (found.length > 0)
    console.warn(
      `Sources are newer than their build in ${found.join(', ')}; the run uses the build (npm run transpile)`
    )
}
