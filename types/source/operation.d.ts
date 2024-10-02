export interface Operation<Input = any, Output = any> {
  mount?: (context: any) => void | Promise<void>
  execute: (input: Input, scope: any) => Promise<Output>
}
