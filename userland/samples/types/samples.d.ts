declare namespace toa.samples {

  type Declaration = {
    title?: string
    input: any
    output: any
  }

  type Request = {
    input: any
  }

  type Reply = {
    output: any
  }

  type Sample = {
    title?: string
    request: Request
    reply: Reply
  }

  type Set = {
    [operation: string]: Sample[]
  }

  type Suite = {
    [component: string]: Set
  }

}

export type Declaration = toa.samples.Declaration
export type Sample = toa.samples.Sample
export type Suite = toa.samples.Suite
