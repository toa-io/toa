<script lang="ts">
  import { badgeVariants } from '$ui/badge'
  import * as Dialog from '$ui/alert-dialog'
  import { slashed } from './ui'
  import { slug } from './request'
  import { dict } from './intl'
  import Session from './Session.svelte'
  import { DESTRUCTIVE, DESTRUCTIVELY, HOVER, type Props } from './Call'

  const { route, verb, of, class: className }: Props = $props()

  let open = $state(false)
</script>

<Dialog.Root bind:open>
  <!-- the verb says what the call is and is what makes it: nothing else on the line is
       worth pressing, and the badge was already the thing being read -->
  <Dialog.Trigger
    id={`discovery-${slug(route)}-${verb.toLowerCase()}-button`}
    title={$dict.call.open}
    class={[
      badgeVariants({ variant: 'outline' }),
      'cursor-pointer font-mono text-[10px]',
      verb === DESTRUCTIVELY ? DESTRUCTIVE : HOVER,
      className,
    ]}
  >
    {verb}
  </Dialog.Trigger>

  <!-- the width goes through the same `data-size` variant the component styles itself
       with: a plain `sm:max-w-*` loses to it on specificity. A call is a form and an
       answer, and both take more room than a question does. -->
  <Dialog.Content
    class="data-[size=default]:max-w-[calc(100vw-2rem)]
      data-[size=default]:sm:max-w-lg"
  >
    <Dialog.Header>
      <Dialog.Title class="flex w-full min-w-0 items-baseline gap-2 font-mono text-sm">
        <span class="text-muted-foreground shrink-0">{verb}</span>
        <span class="min-w-0 truncate">{slashed(route)}</span>
      </Dialog.Title>
    </Dialog.Header>

    <!-- mounted on opening, so what was typed into a cancelled call is not what the next
         one starts from -->
    {#if open}
      <Session {route} {verb} {of} onclose={() => (open = false)} />
    {/if}
  </Dialog.Content>
</Dialog.Root>
