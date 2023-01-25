import * as _schemas from './schema'

declare namespace toa.schemas {

  namespace constructors {

    type namespace = (schemas: any[]) => Namespace

  }

  interface Namespace {
    schema(id: string): _schemas.Schema
  }

}

export type namespace = toa.schemas.constructors.namespace
