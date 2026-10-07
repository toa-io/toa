import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { BeforeAll, AfterAll } from '@cucumber/cucumber'
import * as stage from '@toa.io/userland/stage'

const root = resolve(import.meta.dirname, '../..')
const components = resolve(root, 'components')

BeforeAll({ timeout: 60_000 }, async function () {
  const map = await readFile(resolve(root, '.map.json'), 'utf8')
  const entries = await readdir(components)
  const paths = entries.map((entry) => resolve(components, entry))

  stage.map(JSON.parse(map))

  await stage.serve('configuration')
  await stage.serve('introspection')
  await stage.compose(paths)
  await stage.serve('exposition')
})

AfterAll(async function () {
  await stage.shutdown()
})
