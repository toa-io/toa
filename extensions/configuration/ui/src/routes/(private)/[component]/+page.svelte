<script lang="ts">
  import { Async } from 'svas'
  import { ChevronLeft } from '@lucide/svelte'
  import { Authorized } from '@/iam/ui'
  import { dict } from '@/configuration/ui/intl'
  import { Create, DEFAULT, Value, split } from '@/configuration/ui'
  import { configurations } from '@/configuration'
  import { page } from '$app/state'
  import { base } from '$app/paths'

  /** What an account needs to create one. `auth:rule` in the component's manifest. */
  const ROLE = 'system:configuration:create'

  /** The service answers this when it holds no configuration for the component. */
  const ABSENT = 404

  const component = $derived(page.params.component ?? '')
  const entry = $derived(configurations.get(component))
  const name = $derived(split(component))

  /** Not an error to report: the component simply has none. */
  function absent(error: Error): boolean {
    return 'code' in error && error.code === ABSENT
  }
</script>

<div class="mx-auto h-full max-w-2xl overflow-auto px-4 pb-12">
  <div class="flex items-center gap-2 py-2">
    <a
      id="configuration-back-link"
      href="{base}/"
      aria-label={$dict.value.title}
      class="text-muted-foreground hover:text-foreground -ms-1 rounded-md p-1 transition-colors"
    >
      <ChevronLeft class="size-4" />
    </a>

    <h2 class="min-w-0 truncate font-medium">
      {#if name.namespace !== DEFAULT}<span class="text-muted-foreground"
          >{name.namespace}.</span
        >{/if}{name.component}
    </h2>

    <!-- a gate over a control, not over a screen: an account that may only read sees the
         configuration and simply no action -->
    <div class="ms-auto">
      <Async store={entry} silent>
        {#snippet awaited(configuration)}
          <Authorized role={ROLE}>
            <Create {configuration} />
            {#snippet denied()}{/snippet}
          </Authorized>
        {/snippet}
      </Async>
    </div>
  </div>

  <Async store={entry}>
    {#snippet awaited(configuration)}
      <Value value={configuration.configuration} />

      <!-- the hash names the schema the value was checked against; it needs no label, and
           centred it reads as a footer to the value above rather than a line of its own -->
      <p class="text-muted-foreground mt-2 text-center font-mono text-xs">
        {configuration.epoch}
      </p>
    {/snippet}

    {#snippet error(reason)}
      {#if absent(reason)}
        <p class="text-muted-foreground py-20 text-center">{$dict.value.none}</p>
      {:else}
        <p class="text-destructive py-20 text-center">{reason.message}</p>
      {/if}
    {/snippet}
  </Async>
</div>
