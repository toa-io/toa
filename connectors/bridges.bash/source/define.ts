import * as fs from 'node:fs/promises'
import { join, extname } from 'node:path'
import { DIR, EXT } from './const'
import type { component } from '@toa.io/norm'

export async function operations (root: string): Promise<component.Operations> {
  const path = join(root, DIR)
  const names = await list(path)

  const promises = names
    .map(async (name) => operation(root, name))

  const operations = await Promise.all(promises)

  return operations.reduce<component.Operations>((acc, operation, index) => {
    acc[names[index]] = operation

    return acc
  }, {})
}

export async function operation (root: string, name: string): Promise<component.Operation> {
  const path = join(root, DIR, name + EXT)

  await fs.access(path, fs.constants.F_OK)

  return { type: 'computation' }
}

async function list (path: string): Promise<string[]> {
  const files = await fs.readdir(path)

  return files
    .filter((file) => extname(file) === EXT)
    .map((file) => file.slice(0, -EXT.length))
}
