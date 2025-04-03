declare namespace toa.core {

  type Query = {
    id?: string
    version?: number
    criteria?: Object
    search?: string
    sample?: number
    omit?: number
    limit?: number
    sort?: string[]
    projection?: string[]
  }

}

export type Query = toa.core.Query
