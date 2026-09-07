import authentication from '../../../docs/authentication.md?raw'
import queries from '../../../docs/queries.md?raw'
import multipart from '../../../docs/multipart.md?raw'
import { discovered, guard, method, slashed, system, verbs } from './ui'
import { read } from './shape'
import type { Described, Discovered, Method, Resource, Schema } from '@/discovery'

/** The in-app guides, in the order the landing shows them. */
const GUIDES = [authentication, queries, multipart]

/**
 * A document a reader can take with them: the guides, then what the page shows of the
 * tree, in that order. Schemas are the same shapes the page draws — read as what a value
 * is rather than as what it is checked against — because a document nobody can read is
 * not one.
 */
export function markdown(tree: Discovered | null | undefined, title: string): string {
  const routes = Object.entries(discovered(tree)?.routes ?? {})

  const lines: string[] = [`# ${title}`, '']

  for (const source of GUIDES) lines.push(guide(source), '')

  lines.push('## Resources and methods', '')

  for (const [band, of] of [
    ['Userspace', routes.filter(([route]) => !system(route))],
    ['System', routes.filter(([route]) => system(route))],
  ] as Array<[string, Array<[string, Resource]>]>) {
    if (of.length === 0) continue

    lines.push(`### ${band}`, '')

    for (const [route, resource] of of) lines.push(...described(route, resource))
  }

  return lines.join('\n')
}

/** One guide, nested under the document title; page-only markup is dropped. */
function guide(source: string): string {
  return demote(source.replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/g, '$1')).trim()
}

/** Headings down one, so a guide's `#` sits under the document title. Fences stay put. */
function demote(source: string): string {
  const fence = /```[\s\S]*?```/g
  let out = ''
  let last = 0
  let match: RegExpExecArray | null

  while ((match = fence.exec(source)) !== null) {
    out += deepen(source.slice(last, match.index))
    out += match[0]
    last = match.index + match[0].length
  }

  return out + deepen(source.slice(last))
}

function deepen(text: string): string {
  return text.replaceAll(/^#{1,5} /gm, (heading) => `#${heading}`)
}

function described(route: string, resource: Resource): string[] {
  const lines = [`#### \`${slashed(route)}\``, '']

  if (resource.title !== undefined) lines.push(resource.title, '')

  if (resource.description !== undefined) lines.push(resource.description, '')

  for (const verb of verbs(resource)) lines.push(...answered(verb, method(resource, verb)))

  return lines
}

function answered(verb: string, of: Method): string[] {
  const lines = [`##### \`${verb}\`${of.title === undefined ? '' : ' ' + of.title}`, '']

  if (of.description !== undefined) lines.push(of.description, '')

  lines.push('_' + marks(of).join(' · ') + '_', '')

  for (const [name, parameters] of [
    ['route', of.route],
    ['query', of.query],
  ] as Array<[string, Record<string, Schema> | undefined]>)
    if (parameters !== undefined)
      for (const [parameter, schema] of Object.entries(parameters))
        lines.push(...shaped(`${name}.${parameter}`, schema))

  if (of.octets !== undefined) {
    const { accept, limit, stream } = of.octets
    const said = [accept ?? 'anything', limit].concat(stream === true ? ['streamed'] : [])

    lines.push('**file**', '', said.join(' · '), '')
  }

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
