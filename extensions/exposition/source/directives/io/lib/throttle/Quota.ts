export class Quota {
  private readonly limit: number = 0
  private used: number = 0

  public constructor (limit: number) {
    this.limit = limit
  }

  public get idle (): boolean {
    return this.used === 0
  }

  public use (count = 1): boolean {
    this.used += count

    return this.used < this.limit
  }

  public reset (): void {
    this.used = 0
  }
}
