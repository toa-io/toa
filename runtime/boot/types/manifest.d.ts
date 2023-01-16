import * as _norm from '@toa.io/norm/types'
import * as _composition from './composition'

declare namespace toa.boot {

  type Manifest = (path: string, options?: _composition.Options) => Promise<_norm.Component>

}
