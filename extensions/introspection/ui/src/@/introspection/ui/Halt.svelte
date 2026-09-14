<script lang="ts">
  import { Pause } from '@lucide/svelte'
  import { Label } from '$ui/label'
  import { Input } from '$ui/input'
  import { buttonVariants } from '$ui/button'
  import * as Dialog from '$ui/alert-dialog'
  import { dict } from '$lib/intl'
  import { Hold } from '$com/hold'
  import {
    DEFAULT,
    DURATION,
    MAXIMUM,
    MINIMUM,
    QUIESCENCE_DEFAULT,
    QUIESCENCE_MAXIMUM,
    QUIESCENCE_MINIMUM,
  } from './Halt'

  let open = $state(false)
  let seconds = $state(DEFAULT)
  let quiescence = $state(QUIESCENCE_DEFAULT)

  const interval = $derived(integer(seconds, MINIMUM, MAXIMUM))
  const quiet = $derived(integer(quiescence, QUIESCENCE_MINIMUM, QUIESCENCE_MAXIMUM))
  const ready = $derived(interval && quiet)

  function integer(value: number, min: number, max: number): boolean {
    return Number.isInteger(value) && value >= min && value <= max
  }

  function close(): void {
    open = false
  }
</script>

<Dialog.Root bind:open>
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

    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <Label for="introspection-halt-input">{$dict.halt.interval}</Label>
        <Input
          id="introspection-halt-input"
          type="number"
          inputmode="numeric"
          min={MINIMUM}
          max={MAXIMUM}
          step="1"
          bind:value={seconds}
          aria-invalid={!interval}
          aria-describedby="introspection-halt-hint"
        />
        <p
          id="introspection-halt-hint"
          class={['text-xs', interval ? 'text-muted-foreground' : 'text-destructive']}
        >
          {$dict.halt.bounds}
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label for="introspection-halt-quiescence-input">{$dict.halt.quiescence}</Label>
        <Input
          id="introspection-halt-quiescence-input"
          type="number"
          inputmode="numeric"
          min={QUIESCENCE_MINIMUM}
          max={QUIESCENCE_MAXIMUM}
          step="1"
          bind:value={quiescence}
          aria-invalid={!quiet}
          aria-describedby="introspection-halt-quiescence-hint"
        />
        <p
          id="introspection-halt-quiescence-hint"
          class={['text-xs', quiet ? 'text-muted-foreground' : 'text-destructive']}
        >
          {$dict.halt.quiescenceBounds}
        </p>
      </div>
    </div>

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
