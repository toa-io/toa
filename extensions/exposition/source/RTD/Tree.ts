import { type Node } from './Node'
import { createBranch, createTrunk } from './factory'
import { fragment } from './segment'
import { type Match, type Parameter } from './Match'
import { type MethodFactory } from './Method'
import type * as syntax from './syntax'

export class Tree {
  private readonly trunk: Node
  private readonly methods: MethodFactory

  public constructor (node: syntax.Node, methods: MethodFactory) {
    this.trunk = createTrunk(node, methods)
    this.methods = methods
  }

  public match (path: string): Match | null {
    const fragments = fragment(path)
    const parameters: Parameter[] = []
    const node = this.trunk.match(fragments, parameters)

    if (node === null) return null
    else return { node, parameters }
  }

  public merge (node: syntax.Node, extensions: Record<string, any>): void {
    const branch = createBranch(node, this.methods, extensions)

    this.trunk.merge(branch)
  }
}
