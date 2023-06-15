import { type Remotes } from '../Remotes'
import { type Node } from './Node'
import { createBranch, createTrunk } from './factory'
import { segment } from './segment'
import type * as syntax from './syntax'

export class Tree {
  private readonly trunk: Node
  private readonly remotes: Remotes

  public constructor (definition: syntax.Node, remotes: Remotes) {
    this.trunk = createTrunk(definition, remotes)
    this.remotes = remotes
  }

  public match (path: string): Node | null {
    const segments = segment(path)

    return this.trunk.match(segments)
  }

  public merge (definition: syntax.Branch): void {
    const branch = createBranch(definition, this.remotes)

    this.trunk.merge(branch)
  }
}
