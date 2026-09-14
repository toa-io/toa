<script lang="ts">
  import { ok } from 'svas'
  import { Pause } from '@lucide/svelte'
  import { bounds, type Range } from '@/introspection'
  import { Label } from '$ui/label'
  import { Input } from '$ui/input'
  import { buttonVariants } from '$ui/button'
  import * as Dialog from '$ui/alert-dialog'
  import { dict } from '$lib/intl'
  import { Hold } from '$com/hold'
  import { DEFAULT, DURATION } from './Halt'

  /** What this deployment lets a halt ask for. Read once, when the header mounts. */
  const limits = $derived(ok($bounds) ? $bounds : null)

  let open = $state(false)
  let seconds = $state<number | undefined>(undefined)
  let quiescence = $state<number | undefined>(undefined)

  const interval = $derived(limits !== null && within(seconds, limits.duration))
  const quiet = $derived(limits !== null && within(quiescence, limits.quiescence))
  const ready = $derived(interval && quiet)

  /**
   * The duration opens on what a halt is usually for, within what the deployment allows. How
   * long to wait for it to go quiet is the operator's to state: what it should be is a
   * property of the moment, and a number nobody chose is the wrong one to press a red button on.
   */
  function onOpenChange(next: boolean): void {
    if (!next || limits === null) return

    seconds = clamp(DEFAULT, limits.duration)
    quiescence = undefined
  }

  function within(value: number | undefined, [min, max]: Range): boolean {
    return value !== undefined && Number.isInteger(value) && value >= min && value <= max
  }

  function clamp(value: number, [min, max]: Range): number {
    return Math.min(max, Math.max(min, value))
  }

  function close(): void {
    open = false
  }
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Trigger
    id="introspection-halt-button"
    class={[
      buttonVariants({ variant: 'ghost' }),
      'text-destructive hover:text-destructive',
    ]}
  >
    <Pause />
    {$dict.nav.halt}
  </Dialog.Trigger>

  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$dict.halt.title}</Dialog.Title>
      <Dialog.Description>{$dict.halt.description}</Dialog.Description>
    </Dialog.Header>

    {#if limits === null}
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
            bind:value={seconds}
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
            bind:value={quiescence}
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

    <Dialog.Footer>
      <Dialog.Cancel id="introspection-halt-cancel-button">
        {$dict.halt.cancel}
      </Dialog.Cancel>

      <!-- kept out of the portal: the dialog is centred with a transform, which Safari's
           anchor positioning does not follow -->
      <Hold
        id="introspection-halt-confirm-button"
        variant="destructive"
        portal={false}
        position="top"
        duration={DURATION}
        label={$dict.halt.hold}
        disabled={!ready}
        onclick={close}
      >
        {$dict.nav.halt}
      </Hold>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
