import { createHash } from 'node:crypto'
import { Components, type Component } from './components/index.js'
import { Conditions, type Condition } from './conditions/index.js'
import type { KeyComponent, KeyCondition } from './Configuration.js'
import type { Parameter } from '../../../../RTD/index.js'
import type { Input as Context, Output } from '../../../../io.js'

const NONE: Parameter[] = []

export class Keys {
  private readonly components: Component[]
  private readonly conditions?: Condition[]

  public constructor (components: Component[], conditions?: Condition[]) {
    this.components = components
    this.conditions = conditions
  }

  public static create (componentRules: KeyComponent[], conditionRules?: KeyCondition[],
    route: string = ''): Keys {
    const components = componentRules.map((rule) =>
      new Components[rule.method](rule.options, route))

    const conditions = conditionRules?.map((rule) => new Conditions[rule.method](rule.options))

    return new this(components, conditions)
  }

  /** The key of the request, or nothing when a component cannot key it. */
  public get (context: Context, parameters: Parameter[] = NONE): string | undefined {
    const hash = createHash('sha256')

    for (const component of this.components) {
      const part = component.get(context, parameters)

      if (part === undefined)
        return

      hash.update(part)
    }

    return hash.digest('hex')
  }

  public matches (input: Context, output: Output): boolean {
    return this.conditions?.some((condition) => !condition.match(input, output)) !== true
  }
}
