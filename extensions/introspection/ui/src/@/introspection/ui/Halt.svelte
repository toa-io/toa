<script lang="ts">
  import { ok } from 'svas'
  import { Pause } from '@lucide/svelte'
  import { bounds, halt, type Range } from '@/introspection'
  import { Label } from '$ui/label'
  import { Input } from '$ui/input'
  import { buttonVariants } from '$ui/button'
  import * as Dialog from '$ui/alert-dialog'
  import { dict } from '$lib/intl'
  import { Hold } from '$com/hold'
  import { COUNTDOWN, DURATION, HOLD, QUIESCENCE } from './Halt'

  /** What this deployment lets a halt ask for. Read once, when the header mounts. */
  const limits = $derived(ok($bounds) ? $bounds : null)

  let open = $state(false)

  /** What the operator typed, where they have typed anything. */
  let stated = $state<Stated>({})

  /** Seconds left before the halt is written, and `null` while nothing has been asked for. */
  let left = $state<number | null>(null)
  let failed = $state(false)

  let timer: ReturnType<typeof setInterval> | null = null

  /** The form opens on something that can be pressed: a field nobody has touched is not wrong. */
  const seconds = $derived(
    stated.duration ?? (limits === null ? undefined : clamp(DURATION, limits.duration)),
  )

  const quiescence = $derived(
    stated.quiescence ?? (limits === null ? undefined : clamp(QUIESCENCE, limits.quiescence)),
  )

  const interval = $derived(limits !== null && within(seconds, limits.duration))
  const quiet = $derived(limits !== null && within(quiescence, limits.quiescence))
  const ready = $derived(interval && quiet)

  /** Every opening starts over, on what a halt is usually asked for within what is allowed. */
  function onOpenChange(_: boolean): void {
    forget()

    failed = false
    stated = {}
  }

  /** Held long enough. Nothing has been asked of the deployment yet — the count is the asking. */
  function held(): void {
    if (!ready) return

    failed = false
    left = COUNTDOWN
    timer = setInterval(count, 1000)
  }

  function count(): void {
    if (left === null) return

    left -= 1

    if (left > 0) return

    forget()

    void write()
  }

  async function write(): Promise<void> {
    const error = await halt(seconds!, quiescence!)

    failed = error instanceof Error

    // it is written, and what it does reaches this page too
    if (!failed) open = false
  }

  /** Whatever ends the count — a cancel, the escape key, the write — leaves no timer behind. */
  function forget(): void {
    if (timer !== null) clearInterval(timer)

    timer = null
    left = null
  }

  function within(value: number | undefined, [min, max]: Range): boolean {
    return value !== undefined && Number.isInteger(value) && value >= min && value <= max
  }

  function clamp(value: number, [min, max]: Range): number {
    return Math.min(max, Math.max(min, value))
  }

  interface Stated {
    duration?: number
    quiescence?: number
  }
</script>

<Dialog.Root bind:open {onOpenChange}>
  <!-- until the bounds are in there is nothing to ask for, and the form would open empty -->
  <Dialog.Trigger
    id="introspection-halt-button"
    disabled={limits === null}
    class={[buttonVariants({ variant: 'ghost' }), 'text-destructive hover:text-destructive']}
  >
    <Pause />
    {$dict.nav.halt}
  </Dialog.Trigger>

  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$dict.halt.title}</Dialog.Title>
      <Dialog.Description>{$dict.halt.description}</Dialog.Description>
    </Dialog.Header>

    {#if left !== null}
      <div class="flex flex-col items-center gap-1.5 py-2">
        <p
          id="introspection-halt-countdown"
          class="text-destructive text-6xl font-semibold tabular-nums"
        >
          {left}
        </p>
        <p class="text-muted-foreground text-center text-sm">{$dict.halt.counting}</p>
      </div>
    {:else if limits === null}
      <p class="text-muted-foreground text-sm">{$dict.halt.unknown}</p>
    {:else}
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <Label for="introspection-halt-input">{$dict.halt.interval}</Label>
          <Input
            id="introspection-halt-input"
            type="number"
            inputmode="numeric"
            min={limits.duration[0]}
            max={limits.duration[1]}
            step="1"
            bind:value={() => seconds, (value) => (stated.duration = value)}
            aria-invalid={!interval}
            aria-describedby="introspection-halt-hint"
          />
          <p
            id="introspection-halt-hint"
            class={['text-xs', interval ? 'text-muted-foreground' : 'text-destructive']}
          >
            {$dict.halt.bounds(limits.duration[0], limits.duration[1])}
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label for="introspection-halt-quiescence-input">{$dict.halt.quiescence}</Label>
          <Input
            id="introspection-halt-quiescence-input"
            type="number"
            inputmode="numeric"
            min={limits.quiescence[0]}
            max={limits.quiescence[1]}
            step="1"
            bind:value={() => quiescence, (value) => (stated.quiescence = value)}
            aria-invalid={!quiet}
            aria-describedby="introspection-halt-quiescence-hint"
          />
          <p
            id="introspection-halt-quiescence-hint"
            class={['text-xs', quiet ? 'text-muted-foreground' : 'text-destructive']}
          >
            {$dict.halt.bounds(limits.quiescence[0], limits.quiescence[1])}
          </p>
        </div>
      </div>
    {/if}

    {#if failed}
      <p id="introspection-halt-error" class="text-destructive text-sm">
        {$dict.halt.failed}
      </p>
    {/if}

    <Dialog.Footer>
      <Dialog.Cancel id="introspection-halt-cancel-button">
        {$dict.halt.cancel}
      </Dialog.Cancel>

      {#if left === null}
        <!-- kept out of the portal: the dialog is centred with a transform, which Safari's
             anchor positioning does not follow -->
        <Hold
          id="introspection-halt-confirm-button"
          variant="destructive"
          portal={false}
          position="top"
          duration={HOLD}
          label={$dict.halt.hold}
          disabled={!ready}
          onclick={held}
        >
          {$dict.nav.halt}
        </Hold>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
