import { nameVariable } from './env'
import { normalize } from './annotation'
import type { Dependency, Variable, Variables } from '@toa.io/operations'
import type { Declaration } from './annotation'

export class Deployment {
  private readonly id: string
  private readonly annotation: Annotation

  private constructor (id: string, annotation: Annotation) {
    this.id = id
    this.annotation = annotation
  }

  public static create (id: string, declaration: Declaration): Deployment {
    const annotation = normalize(declaration)

    return new Deployment(id, annotation)
  }

  public export (requests: Request[]): Dependency {
    const variables: Variables = {}

    for (const request of requests)
      variables[request.label] = this.createVariables(request.selectors)

    return { variables }
  }

  private createVariables (selectors: string[]): Variable[] {
    return selectors.map(this.createVariable.bind(this))
  }

  private createVariable (selector: string): Variable {
    const name = nameVariable('TOA', this.id, selector)
    const values = this.resolve(selector)
    const value = values.join(' ')

    return { name, value }
  }

  private resolve (selector: string): string[] {
    if (selector in this.annotation) return this.annotation[selector]

    const segments = selector.split('.')

    while (segments.pop() !== undefined) {
      const current = segments.join('.')

      if (current in this.annotation) return this.annotation[current]
    }

    return this.annotation['.']
  }
}

export interface Request {
  label: string
  selectors: string[]
}

export type Annotation = Record<string, string[]>
