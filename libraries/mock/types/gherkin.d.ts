declare namespace toa.mock.gherkin {

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

    namespace table {
        type Constructor = (table: any[][]) => Table
    }

    interface Table {
        rows(): any[][]

        raw(): any[][]

        transpose(): Table
    }

}

export const steps: toa.mock.gherkin.Steps
export const table: toa.mock.gherkin.table.Constructor
export const clear: () => void
