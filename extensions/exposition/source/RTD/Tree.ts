import { type Remotes } from '../Remotes'
import { type Node } from './Node'
import { createBranch, createTrunk } from './factory'
import { fragmet } from './segment'
import { type Match, type Parameter } from './Match'
import type * as syntax from './syntax'

export class Tree {
  private readonly trunk: Node
  private readonly remotes: Remotes

  public constructor (definition: syntax.Node, remotes: Remotes) {
    this.trunk = createTrunk(definition, remotes)
    this.remotes = remotes
  }

  public match (path: string): Match | null {
    const fragments = fragmet(path)
    const parameters: Parameter[] = []
    const node = this.trunk.match(fragments, parameters)

    if (node === null) return null
    else return { node, parameters }
  }

  public merge (definition: syntax.Branch): void {
    const branch = createBranch(definition, this.remotes)

    this.trunk.merge(branch)
  }
}
