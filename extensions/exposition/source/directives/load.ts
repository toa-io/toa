import { resolve } from 'node:path'
import { type Factory } from './interfaces'

export async function load (paths: string[] = []): Promise<Constructor[]> {
  paths = paths.concat(builtin)

  return paths.map(req)
}

function req (path: string): Constructor {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod: Module = require(path)

  return mod.Factory
}

const builtin = [
  resolve(__dirname, 'dev')
]

type Constructor = new (...args: any[]) => Factory

interface Module {
  Factory: Constructor
}
