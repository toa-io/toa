import { createHash } from 'node:crypto'
import { Components, type Component } from './components'
import { Conditions, type Condition } from './conditions'
import type { KeyComponent, KeyCondition } from './Configuration'
import type { Input as Context, Output } from '../../../../io'

export class Keys {
  private readonly components: Component[]
  private readonly conditions?: Condition[]

  public constructor (components: Component[], conditions?: Condition[]) {
    this.components = components
    this.conditions = conditions
  }

  public static create (componentRules: KeyComponent[], conditionRules?: KeyCondition[]): Keys {
    const components = componentRules.map((rule) => new Components[rule.method](rule.options))
    const conditions = conditionRules?.map((rule) => new Conditions[rule.method](rule.options))

    return new this(components, conditions)
  }

  public get (context: Context): string {
    const hash = createHash('sha256')

    for (const component of this.components)
      hash.update(component.get(context))

    return hash.digest('hex')
  }

  public match (input: Context, output: Output): string | null {
    const miss = this.conditions?.some((condition) => !condition.match(input, output))

    if (miss === true)
      return null
    else
      return this.get(input)
  }
}
