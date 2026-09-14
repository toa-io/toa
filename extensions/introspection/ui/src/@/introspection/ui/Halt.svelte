<script lang="ts">
  import { ok } from 'svas'
  import { Pause } from '@lucide/svelte'
  import { configuration, halt, type Range } from '@/introspection'
  import { Label } from '$ui/label'
  import { Input } from '$ui/input'
  import { Button, buttonVariants } from '$ui/button'
  import { Badge } from '$ui/badge'
  import * as Dialog from '$ui/alert-dialog'
  import { dict } from '$lib/intl'
  import { Hold } from '$com/hold'
  import { COUNTDOWN, DURATION, HOLD, QUIESCENCE } from './Halt'

  /** What this deployment lets a halt ask for, and `null` where it takes none. */
  const limits = $derived(ok($configuration) ? ($configuration.halt ?? null) : null)

  let open = $state(false)

  /** What the operator typed, where they have typed anything. */
  let stated = $state<Stated>({})

  /** Seconds left before the halt is written, and `null` while nothing has been asked for. */
  let left = $state<number | null>(null)
  let sending = $state(false)
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

  /** Nothing in the form takes a change once the count has begun. */
  const counting = $derived(left !== null)

  /** Every opening starts over, on what a halt is usually asked for within what is allowed. */
  function onOpenChange(_: boolean): void {
    release()

    failed = false
    stated = {}
  }

  /** Held long enough. Nothing is asked of the deployment until the count is out. */
  function held(): void {
    if (!ready || counting) return

    failed = false
    left = COUNTDOWN
    timer = setInterval(count, 1000)
  }

  function count(): void {
    if (left === null) return

    left -= 1

    if (left > 0) return

    stop()

    sending = true

    void write()
  }

  async function write(): Promise<void> {
    const error = await halt(seconds!, quiescence!)

    sending = false
    failed = error instanceof Error

    // it is written, and what it does reaches this page too
    if (failed) release()
    else open = false
  }

  /** Called off with a moment to spare: the form is the operator's again. */
  function release(): void {
    stop()

    left = null
    sending = false
  }

  function stop(): void {
    if (timer !== null) clearInterval(timer)

    timer = null
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

<!-- no control where the deployment takes no halt, and none until it says what one may ask -->
{#if limits !== null}
  <Dialog.Root bind:open {onOpenChange}>
    <Dialog.Trigger
      id="introspection-halt-button"
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
            disabled={counting}
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
            disabled={counting}
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

      {#if failed}
        <p id="introspection-halt-error" class="text-destructive text-sm">
          {$dict.halt.failed}
        </p>
      {/if}

      <Dialog.Footer>
        {#if counting}
          <!-- not the dialog's cancel: while the count runs this calls the halt off rather
               than closing it, and the form is where it was -->
          <Button
            id="introspection-halt-cancel-button"
            variant="outline"
            disabled={sending}
            onclick={release}
          >
            {$dict.halt.cancel}
            <Badge id="introspection-halt-countdown" variant="destructive">{left}</Badge>
          </Button>
        {:else}
          <Dialog.Cancel id="introspection-halt-cancel-button">
            {$dict.halt.cancel}
          </Dialog.Cancel>
        {/if}

        <!-- kept out of the portal: the dialog is centred with a transform, which Safari's
             anchor positioning does not follow -->
        <Hold
          id="introspection-halt-confirm-button"
          variant="destructive"
          portal={false}
          position="top"
          duration={HOLD}
          label={$dict.halt.hold}
          disabled={!ready || counting}
          onclick={held}
        >
          {$dict.nav.halt}
        </Hold>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}
