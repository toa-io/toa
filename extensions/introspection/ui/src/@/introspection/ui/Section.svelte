<script lang="ts">
  import type { Props } from './Section'

  const { title, children, class: className }: Props = $props()
</script>

<!-- no gap between the rows: a gap is a strip where the pointer is on nothing, and a
     list of rows that answer the pointer would flicker as it crossed them. Rows carry
     their own padding instead; a section of anything else asks for the spacing it wants. -->
<section class={['flex flex-col', className]}>
  <h3 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</h3>
  {@render children()}
</section>
