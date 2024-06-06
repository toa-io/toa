import type { Identity } from './types'

export function compress (identity: Identity): Identity {
  if (identity.roles === undefined)
    return identity

  const refs: Record<string, Chunk> = {}

  identity.roles = identity.roles
    .sort()
    .map((role, line) => {
      return role
        .split(':')
        .map((part, pos) => {
          if (!(part in refs)) {
            refs[part] = { line, pos }

            return part
          }

          const ref = refs[part]

          return `${ref.line}${ref.pos !== pos ? `~${ref.pos}` : ''}`
        })
        .join(':')
    })

  return identity
}

export function decompress (identity: Identity): Identity {
  if (identity.roles === undefined)
    return identity

  const refs: string[][] = []

  identity.roles = identity.roles
    .map((role, line) => {
      return role
        .split(':')
        .map((part, pos) => {
          const match = REF.exec(part)

          if (match === null) {
            if (refs[line] === undefined)
              refs[line] = []

            refs[line][pos] = part

            return part
          }

          const ref = refs[parseInt(match.groups!.line)][match.groups!.pos === undefined ? pos : parseInt(match.groups!.pos)]

          if (ref === undefined)
            throw new Error('Invalid Identity compression')
          else
            return ref
        })
        .join(':')
    })

  return identity
}

const REF = /^(?<line>\d{1,3})(~(?<pos>\d))?$/

interface Chunk {
  line: number
  pos: number
}
