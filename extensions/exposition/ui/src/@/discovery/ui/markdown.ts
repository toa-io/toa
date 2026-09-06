import { guard, method, slashed, system, verbs } from './ui'
import { read } from './shape'
import type { Described, Discovered, Method, Resource, Schema } from '@/discovery'

/**
 * The tree as a document: what the page shows, in the order it shows it, for a reader who
 * wants it somewhere else. Schemas are the same shapes the page draws — read as what a
 * value is rather than as what it is checked against — because a document nobody can read
 * is not one.
 */
export function markdown(tree: Discovered, title: string): string {
  const routes = Object.entries(tree.routes)

  const lines: string[] = [`# ${title}`, '']

  for (const [band, of] of [
    ['Userspace', routes.filter(([route]) => !system(route))],
    ['System', routes.filter(([route]) => system(route))],
  ] as Array<[string, Array<[string, Resource]>]>) {
    if (of.length === 0) continue

    lines.push(`## ${band}`, '')

    for (const [route, resource] of of) lines.push(...described(route, resource))
  }

  return lines.join('\n')
}

function described(route: string, resource: Resource): string[] {
  const lines = [`### \`${slashed(route)}\``, '']

  if (resource.title !== undefined) lines.push(resource.title, '')

  if (resource.description !== undefined) lines.push(resource.description, '')

  for (const verb of verbs(resource)) lines.push(...answered(verb, method(resource, verb)))

  return lines
}

function answered(verb: string, of: Method): string[] {
  const lines = [`#### \`${verb}\`${of.title === undefined ? '' : ' ' + of.title}`, '']

  if (of.description !== undefined) lines.push(of.description, '')

  lines.push('_' + marks(of).join(' · ') + '_', '')

  for (const [name, parameters] of [
    ['route', of.route],
    ['query', of.query],
  ] as Array<[string, Record<string, Schema> | undefined]>)
    if (parameters !== undefined)
      for (const [parameter, schema] of Object.entries(parameters))
        lines.push(...shaped(`${name}.${parameter}`, schema))

  if (of.input !== undefined) lines.push(...shaped('input', of.input))

  if (of.output !== undefined) lines.push(...shaped('output', of.output))

  if (of.errors !== undefined)
    lines.push('**errors**', '', of.errors.map((code) => `\`${code}\``).join(', '), '')

  return lines
}

/** What guards it, and whether a model may call it: the icons the page draws, as words. */
function marks(of: Described & { mcp?: boolean }): string[] {
  return of.mcp === true ? [guard(of), 'mcp'] : [guard(of)]
}

function shaped(label: string, value: Schema): string[] {
  const lines = read(value)

  if (lines.length === 0) return [`**${label}**`, '', '_not defined_', '']

  const body = lines.map(
    (line) =>
      '  '.repeat(line.depth) +
      (line.key === null ? '' : line.key + ':') +
      (line.type === null ? '' : (line.key === null ? '' : ' ') + line.type),
  )

  return [`**${label}**`, '', '```yaml', ...body, '```', '']
}
