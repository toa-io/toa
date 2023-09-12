import { type Family } from '../Directive'
import Dev from './dev'
import Auth from './auth'

export const families: Family[] = [Dev, Auth]

// export function load (paths: string[] = []): Family[] {
//   paths = paths.concat(builtin)
//
//   return paths.map((path) => require(path))
// }
//
// function list (): string[] {
//   const entries = readdirSync(__dirname, { withFileTypes: true })
//
//   return entries
//     .filter((entry) => entry.isDirectory())
//     .map((entry) => resolve(entry.path, entry.name))
// }
//
// const builtin = list()
