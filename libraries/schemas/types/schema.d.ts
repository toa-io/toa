declare namespace toa.schemas {

  type is = (object: object) => boolean

  namespace constructors {

    type schema = (schema: object) => Schema

  }

  type Error = {
    message: string
    keyword: string
    schema: string
    property?: string
    path?: string
  }

  interface Schema {
    id: string

    fit(object: any): Error | null
  }

}

export type Schema = toa.schemas.Schema
export type schema = toa.schemas.constructors.schema
export type is = toa.schemas.is
