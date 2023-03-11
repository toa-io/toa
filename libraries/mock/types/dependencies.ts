import { dependencies } from '@toa.io/norm/types/context'

type Instance = dependencies.Instance

declare namespace toa.mock.dependencies {
  type Constructor = () => Instance[]
}

export const instances: toa.mock.dependencies.Constructor = undefined
