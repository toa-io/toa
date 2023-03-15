declare namespace toa.tomato {

  type Acronym = 'Gi' | 'Wh' | 'Th' | 'Be' | 'Af' | 'BeAl' | 'AfAl'

  type Keyword =
    'Given'
    | 'When'
    | 'Then'
    | 'Before'
    | 'After'
    | 'BeforeAll'
    | 'AfterAll'
    | Acronym

  type Expression = (sentence?: string | number) => Function

  type Steps = Record<Keyword, Expression>

}

export const steps: toa.tomato.Steps
