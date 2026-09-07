<script lang="ts">
  import { onMount } from 'svelte'
  import { ArrowBigDownDash, Bolt, LogOut, Search, UserKey, Waypoints, X } from '@lucide/svelte'
  import { Authenticated } from '@/iam/ui'
  import { account, authenticated, logout } from '@/iam'
  import {
    CONSOLES,
    Mcp,
    Resources,
    addressed,
    carries,
    markdown,
    only,
    published,
    query,
    stated,
  } from '@/discovery/ui'
  import { tree } from '@/discovery'
  import { Kbd } from '$ui/kbd'
  import { Input } from '$ui/input'
  import { Button } from '$ui/button'
  import { apple } from '$lib/tools'
  import { dict } from '$lib/intl'
  import { Screen } from '$lib/components/shell'
  import { Clipboard } from '$lib/components/clipboard'
  import { configuration, introspection, meta, origin } from '$config'
  import { replaceState } from '$app/navigation'

  /** How much of an identifier fits on a button, and is enough to tell one from another. */
  const IDENTITY = 8

  let filter = $state<HTMLInputElement | null>(null)

  /**
   * Whether the sign-in screen is showing. The page reads without a credential — what is
   * anonymous is described to anyone — and signing in adds what that identity may reach.
   */
  let identifying = $state(false)

  // once there is an identity there is nothing left to ask for
  $effect(() => {
    if ($authenticated) identifying = false
  })

  /*
   * The filter is what the address says it is, so one can be sent to somebody. Read on
   * arrival and whenever the hash is changed from outside, and written back as it is typed
   * — replacing the entry rather than adding one, since a filter is not somewhere to go
   * back to a letter at a time.
   */
  onMount(() => {
    const carried = () => {
      const asked = stated(location.hash)

      if (asked !== null) query.set(asked)
    }

    carried()
    window.addEventListener('hashchange', carried)

    return () => window.removeEventListener('hashchange', carried)
  })

  $effect(() => {
    const address = addressed(location.hash, $query)

    if (address !== location.hash)
      replaceState(address === '' ? location.pathname : address, {})
  })

  /** Whether anything is published to a model, which is what the address is worth having. */
  const mcp = $derived(published($tree))

  /*
   * The other consoles, offered where this reader can see what each of them serves — one
   * that would refuse them is not somewhere to send them.
   */
  const configured = $derived(carries($tree, CONSOLES.configuration))
  const introspected = $derived(carries($tree, CONSOLES.introspection))

  /** The tree as a document, saved where the reader keeps things. */
  function save(): void {
    const document_ = markdown($tree ?? { routes: {} }, meta.title)
    const url = URL.createObjectURL(new Blob([document_], { type: 'text/markdown' }))
    const anchor = window.document.createElement('a')

    anchor.href = url
    anchor.download = 'discovery.md'
    anchor.click()

    URL.revokeObjectURL(url)
  }

  /** With one thing left, the key does what pressing that thing does. */
  function enter(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return

    $only?.()
  }

  // the shortcut every search field has; ⌘ on Apple, Ctrl everywhere else
  function shortcut(event: KeyboardEvent) {
    if (event.key !== 'k' || !(event.metaKey || event.ctrlKey)) return

    event.preventDefault()
    filter?.focus()
    filter?.select()
  }
</script>

<svelte:window onkeydown={shortcut} />

{#snippet resources()}
  <div class="mx-auto w-full max-w-3xl px-4 pb-12">
    <Resources />
  </div>
{/snippet}

<Screen>
  <!-- one header throughout, so what closes the sign-in screen is where what opened it was -->
  <!-- Opaque and nothing else: a backdrop filter over a mask is re-composited on every
       scroll frame, and this is a list that scrolls. `py-3` and the negative margin against
       `Screen`'s own `pt-2` put the title where it sits on the other two consoles. -->
  <header
    class="bg-background sticky top-0 z-50 -mt-2 flex w-full items-center gap-4 px-4 py-3"
    style="view-transition-name: chrome"
  >
      <!-- the sides take equal space, which is what leaves the filter in the middle -->
      <div class="flex shrink-0 items-center gap-2 md:flex-1 md:gap-4">
        <h1 class="hidden min-w-0 truncate text-lg font-medium md:block">{meta.title}</h1>

        <!-- where a model is pointed, for pasting into whatever is being configured -->
        {#if mcp}
          <Clipboard
            id="discovery-mcp-button"
            text={`${origin}/.mcp`}
            variant="ghost"
            size="icon"
            aria-label={$dict.nav.mcp}
            class="text-muted-foreground"
          >
            {#snippet icon()}
              <Mcp class="size-4" />
            {/snippet}
          </Clipboard>
        {/if}

        <Button
          id="discovery-markdown-button"
          variant="ghost"
          size="icon"
          class="text-muted-foreground"
          aria-label={$dict.nav.markdown}
          onclick={save}
        >
          <ArrowBigDownDash />
        </Button>

        <!-- what else the runtime serves, which is a screen rather than a line: the group
             goes where the title does, and for the same reason -->
        <div class="hidden items-center gap-4 md:flex">
          {#if configured}
            <Button
              id="discovery-configuration-button"
              href={configuration}
              variant="ghost"
              size="icon"
              class="text-muted-foreground"
              aria-label={$dict.nav.configuration}
            >
              <Bolt />
            </Button>
          {/if}

          {#if introspected}
            <Button
              id="discovery-introspection-button"
              href={introspection}
              variant="ghost"
              size="icon"
              class="text-muted-foreground"
              aria-label={$dict.nav.introspection}
            >
              <Waypoints />
            </Button>
          {/if}
        </div>
      </div>

      {#if identifying}
        <div class="w-full min-w-0 flex-1 md:max-w-64 md:flex-none md:shrink"></div>
      {:else}
        <div class="relative w-full min-w-0 flex-1 md:max-w-64 md:flex-none md:shrink">
          <Search
            class="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2"
          />

          <Input
            id="nav-filter-input"
            type="search"
            bind:ref={filter}
            bind:value={$query}
            onkeydown={enter}
            aria-label={$dict.nav.filter}
            class="ps-8 pe-3 md:pe-14 [&::-webkit-search-cancel-button]:hidden"
          />

          <Kbd class="absolute end-2 top-1/2 hidden -translate-y-1/2 md:inline-flex">
            {apple ? '⌘K' : 'Ctrl K'}
          </Kbd>
        </div>
      {/if}

      <!-- what is served is what this identity may reach, so who that is belongs here -->
      <div class="flex shrink-0 items-center justify-end gap-1 md:flex-1">
        {#if $authenticated}
          <!-- who you are, and the thing every other call wants: the id itself goes to the
               clipboard, and the first of it is what fits on a button -->
          {#if $account !== null}
            <Clipboard
              id="iam-identity-button"
              text={$account.id}
              label={$account.id.slice(0, IDENTITY)}
              variant="outline"
              size="sm"
              aria-label={$dict.nav.identity}
              class="font-mono"
            />
          {/if}

          <Button
            id="iam-logout-button"
            variant="ghost"
            size="icon"
            aria-label={$dict.nav.signout}
            class="text-destructive hover:text-destructive"
            onclick={logout}
          >
            <LogOut />
          </Button>
        {:else if identifying}
          <Button
            id="iam-cancel-button"
            variant="ghost"
            size="icon"
            aria-label={$dict.nav.back}
            onclick={() => (identifying = false)}
          >
            <X />
          </Button>
        {:else}
          <Button
            id="iam-login-button"
            variant="ghost"
            size="icon"
            aria-label={$dict.nav.signin}
            onclick={() => (identifying = true)}
          >
            <UserKey />
          </Button>
        {/if}
      </div>
  </header>

  {#if identifying}
    <!-- it renders what it wraps once there is an identity, which is where this leaves off -->
    <Authenticated>
      {@render resources()}
    </Authenticated>
  {:else}
    {@render resources()}
  {/if}
</Screen>
