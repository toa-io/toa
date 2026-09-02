<script lang="ts">
  import { tick } from 'svelte'
  import { Async } from 'svas'
  import { passkeys } from '@/passkeys'
  import * as Item from '$ui/item'
  import Summary from './Summary.svelte'
  import Manager from './Manager.svelte'

  let open = $state(false)
  let manager = $state<ReturnType<typeof Manager>>()

  async function toggle(create: boolean) {
    open = !open

    if (!open || !create) return

    await tick()
    manager?.focus()
  }
</script>

<Async store={passkeys}>
  {#snippet awaited(keys)}
    <div class="overflow-hidden rounded-xl border">
      <Item.Group class="gap-0">
        <Summary count={keys.length} {open} ontoggle={() => toggle(keys.length === 0)} />
        <div
          class={[
            'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          ]}>
          <div class="overflow-hidden" inert={!open}>
            <Manager bind:this={manager} {keys} />
          </div>
        </div>
      </Item.Group>
    </div>
  {/snippet}
</Async>
