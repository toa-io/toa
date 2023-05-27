import type * as _norm from '@toa.io/norm/types'
import type * as _dependency from './dependency'
import type * as _image from "./images/image"

declare namespace toa.deployment {

  interface Registry {
    composition(composition: _norm.Composition): _image.Image

    service(path: string, service: _dependency.Service): _image.Image

    prepare(path: string): Promise<string>

    push(): Promise<void>
  }

}

export type Registry = toa.deployment.Registry
