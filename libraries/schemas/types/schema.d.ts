declare namespace toa.schemas{

  type is = (object: object) => boolean

  namespace constructors{

    type schema = (schema: any) => Schema

  }

  type Error = {
    message: string
    keyword: string
    schema: string
    property?: string
    path?: string
  }


}

export interface Schema<T = any>{
  id: string

  fit (value: any): Error | null

  validate (value: unknown): asserts value is T
}

export type schema = toa.schemas.constructors.schema
export type is = toa.schemas.is
