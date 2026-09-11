<script lang="ts">
  import { Pause } from '@lucide/svelte'
  import { Label } from '$ui/label'
  import { Input } from '$ui/input'
  import { buttonVariants } from '$ui/button'
  import * as Dialog from '$ui/alert-dialog'
  import { dict } from '$lib/intl'
  import { Hold } from '$com/hold'
  import { DEFAULT, DURATION, MAXIMUM, MINIMUM } from './Halt'

  let open = $state(false)
  let seconds = $state(DEFAULT)

  const ready = $derived(
    Number.isInteger(seconds) && seconds >= MINIMUM && seconds <= MAXIMUM,
  )

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
        aria-invalid={!ready}
        aria-describedby="introspection-halt-hint"
      />
      <p
        id="introspection-halt-hint"
        class={['text-xs', ready ? 'text-muted-foreground' : 'text-destructive']}
      >
        {$dict.halt.bounds}
      </p>
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
