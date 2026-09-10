import { Connector } from './connector.js'

/**
 * A part of a tree that a halt takes down and builds again.
 *
 * What it holds it *owns*, rather than depends on: a connector with a live dependant refuses to
 * disconnect, and the one way past that refusal skips `close()` with it. A subtree nobody links
 * has neither problem, so the teardown here is the one a shutdown performs.
 *
 * And the subtree is discarded rather than kept, because what comes back is built anew: a sealed
 * communication, a receiver that has stopped announcing, an algorithm that has been unmounted —
 * none of them are asked to work a second time. Nothing outlives a halt but what is above it.
 */
export class Gate extends Connector {
  private readonly build: () => Promise<Connector>
  private live: Connector | null = null

  /** While halted, when what this holds comes back; `0` where it is not halted. */
  private resumesAt = 0

  public constructor(build: () => Promise<Connector>) {
    super()

    this.build = build
  }

  /** Whether what this holds is up. */
  public holding(): boolean {
    return this.live !== null
  }

  /**
   * Seconds until what this holds is back, and `0` where it is up or is not coming back.
   *
   * What sits above a gate answers for it while it is down — the gateway keeps its port and
   * replies `503` rather than closing it — and this is what such a reply says to come back
   * after.
   */
  public remaining(): number {
    if (this.resumesAt === 0) return 0

    return Math.max(0, Math.ceil((this.resumesAt - Date.now()) / 1000))
  }

  /**
   * @param seconds how long it stays down, where it is coming back
   */
  public async down(seconds = 0): Promise<void> {
    const live = this.live

    if (live === null) return

    this.live = null
    this.resumesAt = seconds === 0 ? 0 : Date.now() + seconds * 1000

    await live.disconnect()
  }

  public async up(): Promise<void> {
    this.resumesAt = 0

    if (this.live !== null) return

    const live = await this.build()

    // held only once it is up: a build that throws leaves nothing to take down
    await live.connect()

    this.live = live
  }

  public override debug(node: Record<string, any> = {}): Record<string, any> {
    super.debug(node)

    // what a gate holds is not a dependency, so the walk does not reach it on its own
    this.live?.debug(node[this.id])

    return node
  }

  protected override async open(): Promise<void> {
    await this.up()
  }

  protected override async close(): Promise<void> {
    await this.down()
  }
}
