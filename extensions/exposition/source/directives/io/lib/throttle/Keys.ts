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

  // eslint-disable-next-line max-params
  public static create (componentRules: KeyComponent[], conditionRules?: KeyCondition[],
    route: string = '', header?: string): Keys {
    const components = componentRules.map((rule) =>
      new Components[rule.method](rule.options, route, header))

    const conditions = conditionRules?.map((rule) => new Conditions[rule.method](rule.options))

    return new this(components, conditions)
  }

  public get (context: Context, parameters: Parameter[] = NONE): string {
    const hash = createHash('sha256')

    for (const component of this.components)
      hash.update(component.get(context, parameters))

    return hash.digest('hex')
  }

  public matches (input: Context, output: Output): boolean {
    return this.conditions?.some((condition) => !condition.match(input, output)) !== true
  }
}
