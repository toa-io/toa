<script lang="ts">
  import { ChevronLeft } from '@lucide/svelte'
  import { Button } from '$ui/button'
  import { dict as chrome } from '$lib/intl'
  import { Screen } from '$lib/components/shell'
  import { resolve } from '$app/paths'
  import { html, type Props } from './Document'

  const { source, title, class: className }: Props = $props()
</script>

<Screen class={className}>
  <header
    class="bg-background sticky top-0 z-50 -mt-2 flex w-full items-center gap-3 px-4 py-3"
    style="view-transition-name: chrome"
  >
    <Button
      id="discovery-back-button"
      href={resolve('/')}
      variant="ghost"
      size="icon"
      class="text-muted-foreground"
      aria-label={$chrome.nav.back}
    >
      <ChevronLeft />
    </Button>

    <h1 class="min-w-0 truncate text-lg font-medium">{title}</h1>
  </header>

  <article class="typeset mx-auto w-full max-w-3xl px-4 pb-12">
    <!-- the markdown is ours, bundled at build; snarkdown emits the tags the typeset class reads -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html html(source)}
  </article>
</Screen>

<style>
  /* typeset sets 500 on anchors; a link in running text is the same weight as the sentence */
  .typeset :global(a) {
    font-weight: inherit;
  }

  .typeset :global(li > .note) {
    display: block;
  }
</style>
