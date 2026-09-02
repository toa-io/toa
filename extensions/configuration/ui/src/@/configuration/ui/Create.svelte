<script lang="ts">
  import { dump } from 'js-yaml'
  import { Pencil } from '@lucide/svelte'
  import { create } from '@/configuration'
  import { buttonVariants } from '$ui/button'
  import * as Dialog from '$ui/alert-dialog'
  import { dict } from './intl'
  import Form from './Form.svelte'
  import type { Node } from '@/configuration'
  import type { Props } from './Create'

  const { configuration }: Props = $props()

  let open = $state(false)

  /**
   * The dialog opens on what the component has now, so a change is an edit. A created
   * configuration replaces the whole of the one before it — what is not here is gone.
   */
  const text = $derived(dump(configuration.configuration))

  async function submit(value: Node): Promise<void | Error> {
    const result = await create(configuration.component, value)

    if (result instanceof Error) return result

    open = false
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger
    id="configuration-edit-button"
    class={buttonVariants({ variant: 'outline', size: 'sm' })}
  >
    <Pencil />
    {$dict.create.action}
  </Dialog.Trigger>

  <!-- the width goes through the same `data-size` variant the component styles itself with:
       a plain `sm:max-w-*` loses to it on specificity, and tailwind-merge, seeing a different
       variant, keeps both. An editor takes the room the screen has rather than a fixed step. -->
  <Dialog.Content
    class="data-[size=default]:max-w-[calc(100vw-2rem)]
      data-[size=default]:sm:max-w-[min(90vw,72rem)]"
  >
    <Dialog.Header>
      <Dialog.Title>{$dict.create.title}</Dialog.Title>
    </Dialog.Header>

    <!-- keyed on the text the dialog opened with, so a reopened dialog is not the one
         that was cancelled -->
    {#if open}
      {#key text}
        <Form
          value={{ text }}
          schema={configuration.schema}
          onsubmit={submit}
          oncancel={() => (open = false)}
        />
      {/key}
    {/if}
  </Dialog.Content>
</Dialog.Root>
