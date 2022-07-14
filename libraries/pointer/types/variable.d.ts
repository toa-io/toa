import { Locator } from '@toa.io/core/types'
import { dependency } from '@toa.io/operations/types/deployment'

declare namespace toa.pointer {
  type Variable = (scope: string, locator: Locator, label: string, value: string | number) => dependency.Variable
}

export const variable: toa.pointer.Variable
