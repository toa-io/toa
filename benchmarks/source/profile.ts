import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/** What `node --cpu-prof` writes. */
export interface CpuProfile {
  nodes: Array<{
    id: number
    callFrame: CallFrame
    hitCount?: number
    children?: number[]
  }>
  startTime: number
  endTime: number
  samples: number[]
  timeDeltas: number[]
}

interface CallFrame {
  functionName: string
  url: string
  lineNumber: number
  columnNumber: number
  scriptId: string
}

/** Self time in milliseconds, and its share of the busy total. */
export interface Entry {
  name: string
  self: number
  share: number
}

export interface Summary {
  total: number
  functions: Entry[]
  packages: Entry[]
}

export interface SummaryOptions {
  /** the repository the profiled tree is, so its modules are named by workspace */
  root: string
  top?: number
}

export function summarize(profile: CpuProfile, options: SummaryOptions): Summary {
  const { root, top = 30 } = options
  const frames = new Map(profile.nodes.map((node) => [node.id, node.callFrame]))
  const functions = new Map<string, number>()
  const packages = new Map<string, number>()
  let total = 0

  for (let i = 0; i < profile.samples.length; i++) {
    const frame = frames.get(profile.samples[i])

    if (frame === undefined || frame.functionName === IDLE) continue

    const self = profile.timeDeltas[i] / 1000

    total += self
    add(functions, name(frame, root), self)
    add(packages, owner(frame, root), self)
  }

  return { total, functions: rank(functions, total, top), packages: rank(packages, total, top) }
}

function name(frame: CallFrame, root: string): string {
  if (frame.url === '') return frame.functionName

  // V8 counts lines from zero
  return `${frame.functionName || '(anonymous)'} ${location(frame.url, root)}:${frame.lineNumber + 1}`
}

function location(url: string, root: string): string {
  if (!url.startsWith('file:')) return url

  const path = fileURLToPath(url)
  const modules = path.lastIndexOf(NODE_MODULES)

  if (modules !== -1) return path.slice(modules + NODE_MODULES.length)

  return relative(root, path)
}

function owner(frame: CallFrame, root: string): string {
  if (frame.url === '') return frame.functionName

  if (frame.url.startsWith('node:')) return 'node'

  const path = location(frame.url, root)

  if (frame.url.includes(NODE_MODULES)) {
    const segments = path.split('/')

    return segments[0].startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]
  }

  // a workspace is two levels down: `runtime/core`, `extensions/exposition`
  return path.split('/').slice(0, 2).join('/')
}

function add(map: Map<string, number>, key: string, value: number): void {
  map.set(key, (map.get(key) ?? 0) + value)
}

function rank(map: Map<string, number>, total: number, top: number): Entry[] {
  return [...map.entries()]
    .map(([name, self]) => ({ name, self, share: total === 0 ? 0 : self / total }))
    .sort((a, b) => b.self - a.self)
    .slice(0, top)
}

const IDLE = '(idle)'
const NODE_MODULES = '/node_modules/'
