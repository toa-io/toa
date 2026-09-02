<script lang="ts">
  import { dump } from 'js-yaml'
  import { Plus } from '@lucide/svelte'
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
    id="configuration-new-button"
    class={buttonVariants({ variant: 'outline', size: 'sm' })}
  >
    <Plus />
    {$dict.create.action}
  </Dialog.Trigger>

  <Dialog.Content class="sm:max-w-2xl">
    <Dialog.Header>
      <Dialog.Title>{$dict.create.title}</Dialog.Title>
      <Dialog.Description>{$dict.create.description}</Dialog.Description>
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
