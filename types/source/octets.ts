export interface WorkflowInput<
  TParameters extends Record<string, string> = Record<string, string>,
  TSteps extends Record<string, unknown> = Record<string, unknown>,
> {
  authority: string
  identity?: string
  storage: string
  path: string
  entry: {
    id: string
    type: string
    size: number
    meta: Record<string, unknown>
  }
  parameters: TParameters
  steps: TSteps
}
