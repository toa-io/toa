<script lang="ts">
  import { untrack } from 'svelte'
  import { Textarea } from '$ui/textarea'
  import { Label } from '$ui/label'
  import { Button } from '$ui/button'
  import { onsubmit as handler } from '$lib/tools'
  import { dict } from './intl'
  import { read, type Props } from './Form'

  const { value, schema, onsubmit, oncancel, class: className }: Props = $props()

  // captured once on purpose: the dialog keys the form on what it opened with, so a
  // form that is still mounted is still the one the reader is editing
  let text = $state(untrack(() => value.text))
  let busy = $state(false)
  let failed = $state(false)

  const reading = $derived(read(text, schema, $dict.create.malformed))
  const errors = $derived('errors' in reading ? reading.errors : [])

  async function submit(): Promise<void> {
    if ('errors' in reading) return

    busy = true
    failed = false

    const result = await onsubmit?.(reading.value)

    busy = false
    failed = result instanceof Error
  }
</script>

<form onsubmit={handler(submit)} class={['flex flex-col gap-3', className]}>
  <Label for="configuration-value-input">{$dict.create.editor}</Label>

  <Textarea
    id="configuration-value-input"
    bind:value={text}
    spellcheck={false}
    autocapitalize="off"
    aria-invalid={errors.length > 0}
    aria-describedby={errors.length > 0 ? 'configuration-errors' : undefined}
    class="min-h-64 font-mono text-xs"
  />

  <!-- the room is held whether or not anything is wrong, so the dialog does not jump -->
  <div id="configuration-errors" class="text-destructive min-h-8 font-mono text-xs">
    {#each errors as error, at (at)}
      <div>{error}</div>
    {/each}

    {#if failed && errors.length === 0}
      <div>{$dict.create.failed}</div>
    {/if}
  </div>

  <div class="flex justify-end gap-2">
    <Button
      id="configuration-cancel-button"
      type="button"
      variant="ghost"
      disabled={busy}
      onclick={oncancel}
    >
      {$dict.create.cancel}
    </Button>

    <!-- what does not satisfy the schema never reaches the service -->
    <Button id="configuration-submit-button" type="submit" disabled={busy || errors.length > 0}>
      {$dict.create.submit}
    </Button>
  </div>
</form>
